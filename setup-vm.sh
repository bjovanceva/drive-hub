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
  --port PORT             Published app port (default on first setup: 3000)
  --bind-address ADDRESS  Published interface (default on first setup: 0.0.0.0)
  --login                 Run interactive docker login before pulling images
  --admin-email EMAIL     Create an administrator; prompts for its password
  --help                  Show this help

Missing image names are prompted for on an interactive terminal. Database and
session secrets are generated only when absent. Existing secrets are preserved.
Copy docker-compose.prod.yml beside this script before running it.
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
app_port=''
bind_address=''
admin_email=''
registry_login=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage; exit 0 ;;
    --login) registry_login=true; shift ;;
    --app-image|--tooling-image|--env-file|--port|--bind-address|--admin-email)
      [[ $# -ge 2 && -n "$2" && "$2" != --* ]] || fail "$1 requires a value."
      case "$1" in
        --app-image) app_image=$2 ;;
        --tooling-image) tooling_image=$2 ;;
        --env-file) env_file=$2 ;;
        --port) app_port=$2 ;;
        --bind-address) bind_address=$2 ;;
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
unset APP_IMAGE TOOLING_IMAGE POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB NUXT_SESSION_PASSWORD APP_PORT APP_BIND_ADDRESS

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
configured_port=$(python3 - "$env_file" "$app_image" "$tooling_image" "$app_port" "$bind_address" <<'PY'
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys
import tempfile

path = Path(sys.argv[1])
keys = ('APP_IMAGE', 'TOOLING_IMAGE', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB', 'NUXT_SESSION_PASSWORD', 'APP_PORT', 'APP_BIND_ADDRESS')
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
        sys.exit('Image references are missing. Supply --app-image and --tooling-image or set them in the production environment file.')

for key, override in zip(('APP_IMAGE', 'TOOLING_IMAGE', 'APP_PORT', 'APP_BIND_ADDRESS'), sys.argv[2:]):
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
values['APP_PORT'] = values['APP_PORT'] or '3000'
if not values['APP_PORT'].isdigit() or not 1 <= int(values['APP_PORT']) <= 65535:
    sys.exit('APP_PORT must be a number between 1 and 65535.')
values['APP_BIND_ADDRESS'] = values['APP_BIND_ADDRESS'] or '0.0.0.0'
if not re.fullmatch(r'[a-zA-Z0-9.:-]+', values['APP_BIND_ADDRESS']):
    sys.exit('APP_BIND_ADDRESS must be a valid interface address.')

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
print(values['APP_PORT'])
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
if $registry_login; then
  "${docker_command[@]}" login
fi
printf 'Pulling published images...\n'
"${compose[@]}" pull
printf 'Starting PostgreSQL, applying migrations, and waiting for the app...\n'
if ! "${compose[@]}" up -d --no-build --wait --wait-timeout 180; then
  "${compose[@]}" ps -a
  fail 'Startup failed. Inspect app and migrate logs with the production Compose file; the configuration and database have been preserved.'
fi
if [[ -n "$admin_email" ]]; then
  "${compose[@]}" run --rm --no-deps migrate node scripts/admin.mjs create --email "$admin_email" --name Administrator
fi
"${compose[@]}" ps -a
printf '\nDrive Hub is healthy. Open http://<VM-IP>:%s using your configured interface.\n' "$configured_port"
printf 'The session secret and database password are saved privately in %s.\n' "$env_file"
