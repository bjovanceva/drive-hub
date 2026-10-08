#!/usr/bin/env bash
set -euo pipefail
umask 077

usage() {
  cat <<'HELP'
Set up and start Drive Hub on an Ubuntu VM using published images.

Usage: bash setup-vm.sh [options]
  --app-image IMAGE       Published runtime image, including a version or digest
  --tooling-image IMAGE   Published tooling image from the same release
  --env-file PATH         Private configuration (default: .env.production beside this script)
  --domain DOMAIN         Public domain; prompts if APP_ORIGIN is missing
  --trusted-proxies CIDRS  Comma-separated shared Nginx IPs or CIDRs
  --https                 Use https:// and Secure cookies (after shared Nginx TLS)
  --http                  Use http:// and HTTP cookies for starter smoke tests
  --migrate               Apply migrations before starting the app; back up first
  --login                 Run interactive docker login before pulling images
  --admin-email EMAIL     Create an administrator; prompts for its password
  --help                  Show this help

Missing image names are prompted for on an interactive terminal. Database and
session secrets are generated only when absent. Existing secrets are preserved.
Copy docker-compose.prod.yml beside this script before running it.
The shared Nginx and external web-proxy network must already exist. This script
publishes no ports and does not install certificates or modify the shared proxy.
Migrations run ONLY with --migrate. Existing production databases need a backup
before that option is used. See docs/deployment.md.
HELP
}

fail() { printf 'Error: %s\n' "$*" >&2; exit 1; }
as_root() {
  if [[ $EUID -eq 0 ]]; then
    "$@"
  else
    command -v sudo >/dev/null || fail 'Root privileges are needed. Run this script as root or install sudo.'
    sudo "$@"
  fi
}

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
env_file="$script_dir/.env.production"
app_image=''
tooling_image=''
app_domain=''
trusted_proxies=''
app_scheme=''
run_migrations=false
admin_email=''
registry_login=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --login) registry_login=true; shift ;;
    --migrate) run_migrations=true; shift ;;
    --https) app_scheme=https; shift ;;
    --http) app_scheme=http; shift ;;
    --app-image|--tooling-image|--env-file|--domain|--trusted-proxies|--admin-email)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || fail "$1 requires a value."
      case "$1" in
        --app-image) app_image=$2 ;;
        --tooling-image) tooling_image=$2 ;;
        --env-file) env_file=$2 ;;
        --domain) app_domain=$2 ;;
        --trusted-proxies) trusted_proxies=$2 ;;
        --admin-email) admin_email=$2 ;;
      esac
      shift 2 ;;
    *) fail "Unknown option: $1. Use --help." ;;
  esac
done

[[ $(uname -s) == Linux ]] || fail 'Run this script on the Linux VM, not on your Mac.'
[[ -f "$script_dir/docker-compose.prod.yml" ]] || fail 'docker-compose.prod.yml must be beside this script.'
[[ -d $(dirname -- "$env_file") ]] || fail 'The environment file directory must already exist.'
env_file="$(cd -- "$(dirname -- "$env_file")" && pwd)/$(basename -- "$env_file")"
[[ ! -L "$env_file" ]] || fail 'Use a regular environment file, not a symbolic link.'

# Keep the production file authoritative even if development values were exported.
unset APP_IMAGE TOOLING_IMAGE POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB NUXT_SESSION_PASSWORD APP_ORIGIN TRUSTED_PROXY_CIDRS NUXT_SESSION_COOKIE_SECURE

need_engine=false
need_compose=false
need_python=false
if ! command -v docker >/dev/null; then
  need_engine=true
elif ! command -v dockerd >/dev/null && ! docker info >/dev/null 2>&1; then
  need_engine=true
fi
if ! command -v docker >/dev/null || ! docker compose version >/dev/null 2>&1; then
  need_compose=true
fi
command -v python3 >/dev/null || need_python=true

if $need_engine || $need_compose || $need_python; then
  [[ -r /etc/os-release ]] || fail 'Cannot detect the Linux distribution.'
  # This is trusted OS metadata, not the application environment file.
  . /etc/os-release
  [[ ${ID:-} == ubuntu ]] || fail 'Automatic package installation supports Ubuntu. Install Docker, Compose, and Python 3 first on other distributions.'
  command -v apt-get >/dev/null || fail 'apt-get is required for automatic installation.'
  printf 'Installing missing prerequisites on Ubuntu...\n'
  as_root apt-get update
  as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-upgrade --no-remove ca-certificates curl python3

  if $need_engine || $need_compose; then
    package=docker-compose-plugin
    $need_engine && package=docker-ce
    # Reuse an existing Docker repository when available.
    candidate=$(apt-cache policy "$package" | awk '/Candidate:/ { print $2; exit }')
    if [[ -z "$candidate" || "$candidate" == '(none)' ]]; then
      codename=${UBUNTU_CODENAME:-${VERSION_CODENAME:-}}
      [[ -n "$codename" ]] || fail 'Ubuntu release codename is missing.'
      [[ ! -e /etc/apt/sources.list.d/docker.sources ]] || fail 'An existing Docker repository is unavailable. Fix its apt configuration and rerun.'
      as_root install -m 0755 -d /etc/apt/keyrings
      as_root curl -fsSL "https://download.docker.com/linux/ubuntu/gpg" -o /etc/apt/keyrings/docker.asc
      as_root chmod a+r /etc/apt/keyrings/docker.asc
      as_root tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $codename
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
      as_root apt-get update
    fi
    packages=(docker-compose-plugin)
    if $need_engine; then
      packages+=(docker-ce docker-ce-cli containerd.io)
    fi
    as_root env DEBIAN_FRONTEND=noninteractive apt-get install -y --no-upgrade --no-remove "${packages[@]}"
  fi
fi

docker compose version >/dev/null 2>&1 || fail 'Docker Compose is still unavailable after installation.'

# Let Compose parse its own dotenv syntax. Never execute the private .env file.
configured_origin=$(python3 - "$env_file" "$app_image" "$tooling_image" "$app_domain" "$trusted_proxies" "$app_scheme" <<'PY'
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit

path = Path(sys.argv[1])
keys = ('APP_IMAGE', 'TOOLING_IMAGE', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'NUXT_SESSION_PASSWORD', 'APP_ORIGIN', 'TRUSTED_PROXY_CIDRS', 'NUXT_SESSION_COOKIE_SECURE')
original = path.read_text() if path.exists() else ''
with tempfile.TemporaryDirectory(prefix='drivehub-config-') as scratch:
    scratch = Path(scratch)
    source = path if path.exists() else scratch / '.env'
    if not source.exists():
        source.write_text('')
    config = scratch / 'compose.yml'
    config.write_text('services:\n  settings:\n    image: busybox\n    environment:\n' + ''.join(f'      {key}: ${{{key}:-}}\n' for key in keys))
    result = subprocess.run(['docker', 'compose', '--env-file', str(source), '-f', str(config), 'config', '--format', 'json'], capture_output=True, text=True)
    if result.returncode:
        sys.exit('Cannot parse the production environment file. Check its dotenv syntax.')
    # `config` escapes literal dollars for safe reuse of the rendered Compose
    # file. Decode that serialization before comparing or validating values.
    values = {key: value.replace('$$', '$') for key, value in json.loads(result.stdout)['services']['settings']['environment'].items()}
original_values = dict(values)

def prompt(label):
    try:
        with open('/dev/tty', 'r+') as terminal:
            terminal.write(label + ': ')
            terminal.flush()
            return terminal.readline().strip()
    except OSError:
        sys.exit('A required value is missing. Supply the image references, --domain and --trusted-proxies or set them in the production environment file.')

for key, override in zip(('APP_IMAGE', 'TOOLING_IMAGE'), sys.argv[2:4]):
    if override:
        values[key] = override
for key, label in (('APP_IMAGE', 'Published app image (namespace/drive-hub-app:version)'), ('TOOLING_IMAGE', 'Published tooling image (namespace/drive-hub-tooling:version)')):
    if not values[key] or values[key].startswith('your-dockerhub-user/'):
        values[key] = prompt(label)
    image = values[key]
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9._:/@-]*', image) or image.startswith('your-dockerhub-user/'):
        sys.exit(f'{key} must be a real published image reference.')
    if '@sha256:' not in image and ':' not in image.rsplit('/', 1)[-1]:
        sys.exit(f'{key} must include a version tag or digest.')

values['POSTGRES_USER'] = values['POSTGRES_USER'] or 'drivehub'
values['POSTGRES_DB'] = values['POSTGRES_DB'] or 'drivehub'
values['POSTGRES_PASSWORD'] = values['POSTGRES_PASSWORD'] or secrets.token_hex(32)
values['NUXT_SESSION_PASSWORD'] = values['NUXT_SESSION_PASSWORD'] or secrets.token_hex(32)
if len(values['NUXT_SESSION_PASSWORD']) < 32:
    sys.exit('Existing NUXT_SESSION_PASSWORD is too short; set at least 32 characters. It has not been changed.')
domain, trusted_override, scheme_override = sys.argv[4:7]
if domain:
    if not re.fullmatch(r'[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?', domain) or '.' not in domain:
        sys.exit('--domain must be a domain name without a scheme, path or port.')
    scheme = scheme_override or (urlsplit(values['APP_ORIGIN']).scheme if values['APP_ORIGIN'] else 'http')
    values['APP_ORIGIN'] = f'{scheme}://{domain.lower()}'
if not values['APP_ORIGIN']:
    values['APP_ORIGIN'] = ('https' if scheme_override == 'https' else 'http') + '://' + prompt('Public domain (for example drivehub.example.com)')
origin = urlsplit(values['APP_ORIGIN'])
if scheme_override:
    values['APP_ORIGIN'] = scheme_override + '://' + origin.netloc
    origin = urlsplit(values['APP_ORIGIN'])
if origin.scheme not in ('http', 'https') or not origin.hostname or origin.username or origin.password or origin.path not in ('', '/') or origin.query or origin.fragment:
    sys.exit('APP_ORIGIN must be a public HTTP(S) origin without a path or credentials.')
try:
    origin.port
except ValueError:
    sys.exit('APP_ORIGIN contains an invalid port.')
values['APP_ORIGIN'] = origin.scheme + '://' + origin.netloc.lower()
if trusted_override:
    values['TRUSTED_PROXY_CIDRS'] = trusted_override
if not values['TRUSTED_PROXY_CIDRS']:
    values['TRUSTED_PROXY_CIDRS'] = prompt('Trusted shared Nginx IP or CIDR (from docker inspect)')
try:
    for cidr in values['TRUSTED_PROXY_CIDRS'].split(','):
        network = ipaddress.ip_network(cidr.strip(), strict=False)
        if network.prefixlen == 0:
            raise ValueError('Do not trust every address')
except ValueError:
    sys.exit('TRUSTED_PROXY_CIDRS must list valid IPs/CIDRs; do not use 0.0.0.0/0 or ::/0.')
expected_secure = 'true' if origin.scheme == 'https' else 'false'
if scheme_override or not values['NUXT_SESSION_COOKIE_SECURE']:
    values['NUXT_SESSION_COOKIE_SECURE'] = expected_secure
if values['NUXT_SESSION_COOKIE_SECURE'] != expected_secure:
    sys.exit('NUXT_SESSION_COOKIE_SECURE must be true for HTTPS or false for the HTTP starter. Use --https or --http to switch both settings together.')

# Preserve existing assignments, comments, and unrelated settings. Only replace
# explicitly overridden fields or empty values; secrets are never rotated here.
updated = original
for key in keys:
    pattern = re.compile(rf'^{key}=.*$', re.MULTILINE)
    previous = re.search(pattern, original)
    if previous and values[key] == original_values[key]:
        continue
    # Newly generated values and overrides use a single-line literal assignment.
    value = values[key]
    if '\n' in value or '\r' in value:
        sys.exit(f'{key} must fit on one line when updated.')
    assignment = f"{key}='{value.replace(chr(39), chr(92) + chr(39))}'"
    if previous:
        updated = pattern.sub(lambda _: assignment, updated)
    else:
        updated += ('\n' if updated and not updated.endswith('\n') else '') + assignment + '\n'

if updated != original or not path.exists():
    with tempfile.NamedTemporaryFile(mode='w', prefix='.drivehub-env-', dir=path.parent, delete=False) as target:
        target.write(updated)
        replacement = target.name
    os.chmod(replacement, 0o600)
    os.replace(replacement, path)
else:
    os.chmod(path, 0o600)
print(values['APP_ORIGIN'])
PY
)
printf 'Production configuration ready: %s (permissions 600).\n' "$env_file"

docker_command=(docker)
if ! docker info >/dev/null 2>&1; then
  if ! as_root docker info >/dev/null 2>&1; then
    [[ -z ${DOCKER_HOST:-}${DOCKER_CONTEXT:-} ]] || fail 'The selected Docker host/context is unavailable.'
    command -v systemctl >/dev/null || fail 'Start the Docker daemon, then rerun this script.'
    as_root systemctl enable --now docker
  fi
  docker_command=(docker)
  [[ $EUID -eq 0 ]] || docker_command=(sudo docker)
fi
"${docker_command[@]}" info >/dev/null 2>&1 || fail 'Cannot connect to the Docker daemon.'
if $need_engine; then
  as_root systemctl enable --now docker
fi

compose=("${docker_command[@]}" compose --project-directory "$script_dir" --env-file "$env_file" -f "$script_dir/docker-compose.prod.yml")
"${compose[@]}" config --quiet
"${docker_command[@]}" network inspect web-proxy >/dev/null 2>&1 || fail 'External web-proxy network is missing. Have the shared-proxy operator create it; this script will not change shared infrastructure.'
if $registry_login; then
  "${docker_command[@]}" login
fi
printf 'Pulling published images...\n'
"${compose[@]}" pull app postgres migrate
printf 'Starting PostgreSQL...\n'
if ! "${compose[@]}" up -d --no-build --wait --wait-timeout 120 postgres; then
  "${compose[@]}" ps -a
  fail 'Startup failed: PostgreSQL is not healthy. Inspect its logs before continuing.'
fi
if $run_migrations; then
  "${compose[@]}" stop app
  printf 'Applying explicitly requested migrations...\n'
  if ! "${compose[@]}" run --rm migrate; then
    fail 'Migrations failed. The app remains stopped; inspect the migration error before restarting it.'
  fi
else
  printf 'Migrations were not requested. Existing schema must already be current.\n'
fi
printf 'Starting the app and waiting for health...\n'
if ! "${compose[@]}" up -d --no-build --wait --wait-timeout 180 app; then
  "${compose[@]}" ps -a
  fail 'Startup failed. Inspect app logs; for a new database apply migrations with --migrate. Configuration and data have been preserved.'
fi
if [[ -n "$admin_email" ]]; then
  "${compose[@]}" run --rm --no-deps migrate node scripts/admin.mjs create --email "$admin_email" --name Administrator
fi
"${compose[@]}" ps -a
printf '\nDrive Hub is healthy internally. Shared Nginx must route %s to nuxt-web:3000.\n' "$configured_origin"
printf 'The session secret and database password are saved privately in %s.\n' "$env_file"
if [[ "$configured_origin" == http://* ]]; then
  printf 'HTTP starter mode is active. After shared Nginx TLS is configured, rerun with --https.\n'
fi
