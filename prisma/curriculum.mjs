/**
 * Development curriculum catalogue.
 *
 * Each generated row represents one 45-minute teaching hour. Repeated modules
 * deliberately keep a shared title with a (current/total) suffix so the lesson
 * plan reads as a progression rather than as dozens of unrelated topics.
 */

const lesson = (title, concept, goal) => ({ title, concept, goal });

const moduleLessons = (moduleTitle, topics) =>
  topics.map((topic, index) => ({
    title:
      topics.length === 1
        ? `${moduleTitle}: ${topic.title}`
        : `${moduleTitle}: ${topic.title} (${index + 1}/${topics.length})`,
    concept: topic.concept,
    goal: topic.goal,
  }));

const repeatLesson = (moduleTitle, count, concept, goal) =>
  Array.from({ length: count }, (_, index) =>
    lesson(
      count === 1 ? moduleTitle : `${moduleTitle} (${index + 1}/${count})`,
      concept,
      goal,
    ),
  );

const sharedRoadTheory = (vehicle) => [
  ...moduleLessons("Road rules and driver responsibility", [
    lesson(
      "licensing and safe conduct",
      `Legal duties, documents and responsible use of a ${vehicle}.`,
      "Explain the driver’s core legal and safety responsibilities.",
    ),
    lesson(
      "road position and lane discipline",
      "Traffic flow, lane choice, road position and use of mirrors.",
      "Choose a lawful, visible and predictable road position.",
    ),
    lesson(
      "speed and following distance",
      "Speed limits, stopping distance and adapting space to risk.",
      "Select a safe speed and following gap for the conditions.",
    ),
  ]),
  ...moduleLessons("Signs, signals and markings", [
    lesson(
      "warning and priority signs",
      "Warning, priority and prohibition signs.",
      "Recognise the sign early and state the required response.",
    ),
    lesson(
      "mandatory and information signs",
      "Mandatory directions, information signs and route guidance.",
      "Follow mandatory directions and plan from information signs.",
    ),
    lesson(
      "road markings and signals",
      "Lane markings, traffic lights and signals from authorised persons.",
      "Resolve the controlling instruction when signals overlap.",
    ),
  ]),
  ...moduleLessons("Junctions and priority", [
    lesson(
      "uncontrolled junctions",
      "Observation, right-of-way and safe approach at uncontrolled junctions.",
      "Identify priority and cross without forcing another road user to react.",
    ),
    lesson(
      "controlled junctions",
      "Signed and signal-controlled junctions, filter lanes and turning rules.",
      "Plan lane, speed and observations before entering a controlled junction.",
    ),
    lesson(
      "roundabouts and rail crossings",
      "Roundabout lane choice, signalling and level-crossing precautions.",
      "Enter, circulate and leave with correct priority and signalling.",
    ),
  ]),
  ...moduleLessons("Sharing the road", [
    lesson(
      "pedestrians and vulnerable users",
      "Pedestrians, children, cyclists, motorcyclists and mobility-impaired users.",
      "Anticipate vulnerable road users and create a safe margin.",
    ),
    lesson(
      "overtaking and meeting traffic",
      "Safe overtaking, being overtaken and meeting on narrow roads.",
      "Decide when a pass is lawful and complete it with adequate clearance.",
    ),
  ]),
  ...moduleLessons("Hazard awareness", [
    lesson(
      "weather and visibility",
      "Rain, snow, ice, wind, glare, darkness and reduced visibility.",
      "Adapt speed, lights and space to environmental hazards.",
    ),
    lesson(
      "risk prediction",
      "Scanning, blind areas, escape space and early response to developing hazards.",
      "Describe and apply a repeatable hazard-perception routine.",
    ),
  ]),
  ...moduleLessons("Vehicle safety", [
    lesson(
      "daily checks and warning systems",
      `Tyres, lights, brakes, fluids, controls and warning lamps on a ${vehicle}.`,
      "Complete a safety check and identify defects that prevent a journey.",
    ),
    lesson(
      "occupants, loads and environmental use",
      "Restraints, secure loads, economical driving and avoidable emissions.",
      "Prepare occupants and loads and operate with minimal risk and waste.",
    ),
  ]),
  ...moduleLessons("Human factors and incidents", [
    lesson(
      "fitness to drive",
      "Fatigue, alcohol, drugs, distraction, emotion and peer pressure.",
      "Recognise impairment and choose not to drive when fitness is reduced.",
    ),
    lesson(
      "collisions and emergencies",
      "Protecting a scene, first actions, emergency services and breakdown safety.",
      "Take safe, lawful action after a collision or breakdown.",
    ),
  ]),
  lesson(
    "Journey planning and safe parking",
    "Route choice, fuel or energy, rest, stopping restrictions, parking security and leaving the vehicle safely.",
    "Plan a suitable journey and choose a lawful, low-risk place to stop.",
  ),
  ...repeatLesson(
    "Theory consolidation and mock test",
    2,
    "Integrated rules, signs, hazards and category-specific questions.",
    "Demonstrate exam-ready reasoning and correct weak areas.",
  ),
];

const motorcycleTheory = (vehicle) => {
  const lessons = sharedRoadTheory(vehicle);
  lessons[13] = lesson(
    "Motorcycle safety: protective equipment",
    "Helmet fit, protective clothing, conspicuity, luggage and passenger safety.",
    "Select effective protective equipment and prepare rider, passenger and luggage.",
  );
  lessons[14] = lesson(
    "Motorcycle safety: tyres and controls",
    "Tyres, brakes, chain or drive, lights, steering and fluid checks.",
    "Complete a systematic pre-ride check and recognise an unsafe motorcycle.",
  );
  return lessons;
};

const commercialTheory = (vehicle, purpose) => [
  lesson(
    "Category rules and professional responsibility",
    `Licence scope, dimensions, speed rules and professional duties for ${vehicle}.`,
    "Explain the limits and legal responsibilities of the category.",
  ),
  lesson(
    "Vehicle safety and technical checks",
    `Brakes, steering, tyres, fluids, warning systems and safety equipment on ${vehicle}.`,
    "Complete and explain a roadworthiness inspection.",
  ),
  lesson(
    `${purpose} safety`,
    `${purpose}, weight distribution, restraint and risks created by vehicle size.`,
    `Prepare the ${purpose.toLowerCase()} and manage the vehicle-specific risks safely.`,
  ),
  lesson(
    "Hazards, incidents and journey planning",
    "Blind areas, vulnerable users, route restrictions, fatigue, breakdowns and emergencies.",
    "Plan and complete a compliant journey while anticipating high-consequence hazards.",
  ),
];

const trailerTheory = (towingVehicle) => [
  lesson(
    "Combination limits and documents",
    `Permitted masses, dimensions, licence scope and documents for ${towingVehicle} and trailer combinations.`,
    "Confirm that a proposed vehicle-and-trailer combination is legal.",
  ),
  lesson(
    "Coupling and safety checks",
    "Coupling sequence, secondary connections, electrical systems, brakes, tyres and breakaway devices.",
    "Couple and inspect a trailer without omitting a safety-critical connection.",
  ),
  lesson(
    "Loading and stability",
    "Nose weight, axle loads, load restraint, sway and the effect of speed and wind.",
    "Load for stability and respond correctly to developing trailer sway.",
  ),
  lesson(
    "Combination driving and incidents",
    "Longer stopping distance, wider turns, restricted routes, breakdowns and uncoupling emergencies.",
    "Plan safe margins and manage combination-specific hazards.",
  ),
];

const basicVehiclePractical = (vehicle) =>
  moduleLessons("Vehicle preparation", [
    lesson(
      "safety check",
      `Walk-around, tyres, lights, glass, fluids and visible defects on the ${vehicle}.`,
      "Decide whether the vehicle is safe and legal to use.",
    ),
    lesson(
      "driving position and controls",
      "Seat, mirrors, restraint, controls, instruments and blind areas.",
      "Prepare the cockpit and identify every control needed for the lesson.",
    ),
  ]);

const carPractical = [
  ...basicVehiclePractical("car"),
  ...moduleLessons("Basic vehicle control", [
    lesson(
      "moving off and stopping",
      "Observation, signalling, clutch control, steering and a controlled stop.",
      "Move away and stop smoothly without affecting other road users.",
    ),
    lesson(
      "gears and speed control",
      "Progressive acceleration, gear selection, engine braking and smooth deceleration.",
      "Match gear and speed to the road while maintaining full control.",
    ),
    lesson(
      "steering and road position",
      "Accurate steering, lane position and clearance from hazards.",
      "Hold a stable course and position the car safely.",
    ),
    lesson(
      "mirror-signal-manoeuvre routine",
      "Structured observation before changes of speed or direction.",
      "Use an effective observation routine without prompting.",
    ),
  ]),
  ...moduleLessons("Proving ground manoeuvres", [
    lesson(
      "straight-line reversing",
      "All-round observation and low-speed control while reversing in lane.",
      "Reverse accurately without crossing the marked boundary.",
    ),
    lesson(
      "turning the vehicle",
      "Safe change of direction using forward and reverse gears.",
      "Turn the vehicle around with continuous observation and control.",
    ),
    lesson(
      "parallel parking",
      "Reference points, steering timing and clearance when parking parallel.",
      "Park and leave the space safely within the marked area.",
    ),
    lesson(
      "bay parking",
      "Forward and reverse bay parking with correction and exit observations.",
      "Finish centrally in a bay and exit without endangering others.",
    ),
    lesson(
      "uphill start",
      "Parking brake, clutch bite, observations and rollback prevention on a gradient.",
      "Move off uphill smoothly without rolling back.",
    ),
    lesson(
      "precision and emergency stop",
      "Accurate normal stopping and a controlled emergency response.",
      "Stop promptly under control and secure the vehicle.",
    ),
  ]),
  ...repeatLesson(
    "Quiet-road driving",
    4,
    "Moving off, stopping, junction routines, bends and meeting traffic on low-risk roads.",
    "Coordinate controls and observations consistently with decreasing instructor support.",
  ),
  ...repeatLesson(
    "Urban junctions and roundabouts",
    5,
    "Priority, lane selection, signals, crossings, roundabouts and complex urban junctions.",
    "Make safe independent decisions in progressively busier junction situations.",
  ),
  ...repeatLesson(
    "Traffic interaction",
    4,
    "Pedestrians, cyclists, buses, parked vehicles, overtaking and narrow-road clearance.",
    "Share space predictably and maintain a safe margin around vulnerable users.",
  ),
  ...repeatLesson(
    "Rural-road driving",
    3,
    "Higher speeds, bends, crests, limited views, overtaking judgement and rural hazards.",
    "Read the road ahead and select a speed that preserves stopping distance.",
  ),
  ...repeatLesson(
    "High-speed roads",
    2,
    "Joining, lane discipline, following distance and leaving dual carriageways or motorways where permitted.",
    "Merge, cruise and exit safely at higher traffic speeds.",
  ),
  ...repeatLesson(
    "Adverse conditions and eco-driving",
    2,
    "Driving in darkness or poor weather and using anticipation for smooth, efficient progress.",
    "Adapt visibility, grip, speed and vehicle use to changing conditions.",
  ),
  ...repeatLesson(
    "Independent driving",
    3,
    "Following directions and signs while planning safely without step-by-step instruction.",
    "Complete an unfamiliar route independently and correct mistakes safely.",
  ),
  lesson(
    "Mock practical test",
    "Full vehicle preparation, proving-ground tasks and representative public-road route.",
    "Demonstrate consistent test-standard driving and identify final development needs.",
  ),
];

const mopedPractical = [
  ...basicVehiclePractical("moped or light quadricycle"),
  ...moduleLessons("Low-speed control", [
    lesson(
      "balance and observation",
      "Stable low-speed travel, head position and all-round observation.",
      "Maintain balance and direction at walking pace.",
    ),
    lesson(
      "starting, stopping and turning",
      "Smooth acceleration, progressive braking and accurate steering.",
      "Start, stop and turn without loss of stability or control.",
    ),
    lesson(
      "slow slalom",
      "Vision, balance, throttle and steering through spaced markers.",
      "Complete the slalom without touching markers or putting a foot down where applicable.",
    ),
  ]),
  ...moduleLessons("Proving ground manoeuvres", [
    lesson(
      "controlled curve and U-turn",
      "Low-speed curved path and change of direction in limited space.",
      "Turn within the marked area while remaining stable.",
    ),
    lesson(
      "avoidance and emergency braking",
      "Prompt steering response followed by straight, progressive emergency braking.",
      "Avoid a hazard and stop safely without locking or losing control.",
    ),
    lesson(
      "parking and securing",
      "Positioning, parking stand or brake, shutdown and safe dismount.",
      "Park and secure the vehicle without creating a hazard.",
    ),
  ]),
  ...repeatLesson(
    "Urban road riding",
    2,
    "Road position, junctions, signals, vulnerable users and visibility to others.",
    "Ride predictably through normal urban traffic with safe margins.",
  ),
  lesson(
    "Mixed-route independent ride",
    "Independent decisions across junctions, bends and changing traffic density.",
    "Complete a mixed route safely with minimal prompting.",
  ),
  lesson(
    "Mock practical test",
    "Preparation, proving-ground exercises and a representative public-road ride.",
    "Demonstrate consistent test-standard control, observation and judgement.",
  ),
];

const motorcyclePractical = [
  ...basicVehiclePractical("motorcycle"),
  ...moduleLessons("Machine control", [
    lesson(
      "mounting, moving off and stopping",
      "Safe mounting, stand use, clutch bite, balance and controlled stopping.",
      "Move off and stop smoothly while keeping the motorcycle stable.",
    ),
    lesson(
      "gears, braking and steering",
      "Gear changes, coordinated brakes, counter-steering and stable road position.",
      "Match speed, gear and direction without upsetting the motorcycle.",
    ),
    lesson(
      "observation and signals",
      "Mirror checks, shoulder checks, signalling and blind-area management.",
      "Change speed or direction only after effective observation.",
    ),
  ]),
  ...moduleLessons("Slow-speed exercises", [
    lesson(
      "walking pace and slalom",
      "Clutch, throttle, rear brake, vision and balance through markers.",
      "Remain stable at walking pace and complete a controlled slalom.",
    ),
    lesson(
      "figure eight and U-turn",
      "Tight turns, head position and balance in a restricted area.",
      "Complete both exercises inside the boundary without loss of control.",
    ),
    lesson(
      "slow ride with passenger or load awareness",
      "Low-speed stability and the effect of additional mass.",
      "Adjust control inputs for load while retaining balance and observation.",
    ),
  ]),
  ...moduleLessons("Proving ground manoeuvres", [
    lesson(
      "normal stop and parking",
      "Accurate stop, safe dismount, stand placement and securing the motorcycle.",
      "Stop on target and leave the motorcycle safely secured.",
    ),
    lesson(
      "high-speed slalom and avoidance",
      "Vision, counter-steering and rapid but stable direction changes.",
      "Avoid the marked hazard at the required speed without striking markers.",
    ),
    lesson(
      "emergency braking",
      "Reaction, upright posture and maximum controlled use of both brakes.",
      "Stop rapidly and under control within the safe area.",
    ),
    lesson(
      "gradient start",
      "Rear brake, clutch and throttle coordination on an incline.",
      "Move away uphill without rollback, stall or loss of balance.",
    ),
  ]),
  ...repeatLesson(
    "Urban road riding",
    3,
    "Road position, junctions, filtering restrictions, blind spots and vulnerable road users.",
    "Ride visibly and predictably through progressively complex urban traffic.",
  ),
  ...repeatLesson(
    "Open-road bends and speed",
    2,
    "Safe corner approach, sight lines, stability, following gaps and wind effects.",
    "Choose entry speed and road position that preserve grip and stopping distance.",
  ),
  ...repeatLesson(
    "Hazard response",
    2,
    "Surface hazards, sudden stops, avoidance choices and escape-space planning.",
    "Detect hazards early and respond without abrupt or unstable inputs.",
  ),
  lesson(
    "Mock practical test",
    "Preparation, proving-ground exercises and independent road riding.",
    "Demonstrate consistent test-standard riding across the complete assessment.",
  ),
];

const trailerPractical = (vehicle, extended = false) => [
  ...repeatLesson(
    "Combination safety checks and coupling",
    extended ? 2 : 1,
    `Positioning, coupling, electrical and brake connections, security checks and uncoupling for the ${vehicle}.`,
    "Couple and uncouple in the correct sequence and verify every connection.",
  ),
  ...moduleLessons("Proving ground manoeuvres", [
    lesson(
      "straight reversing",
      "Mirror use, small steering inputs and trailer alignment.",
      "Reverse in a straight corridor while keeping the combination controlled.",
    ),
    lesson(
      "curved reversing",
      "Planning and correcting trailer angle while reversing around a curve.",
      "Reverse through the marked curve without boundary contact.",
    ),
    lesson(
      "reverse parking",
      "Approach position, articulation control and final alignment in a bay.",
      "Park the combination accurately and secure it safely.",
    ),
  ]),
  ...repeatLesson(
    "Public-road combination driving",
    extended ? 2 : 1,
    "Wide turns, clearance, braking distance, lane position, junctions and overtaking limits.",
    "Drive the combination without clipping corners or surprising other traffic.",
  ),
  lesson(
    "Mock practical test",
    "Full safety check, coupling, reversing exercise and representative road route.",
    "Demonstrate test-standard combination control and judgement.",
  ),
];

const goodsPractical = (vehicle, total) => {
  const extended = total === 20;
  return [
    ...basicVehiclePractical(vehicle),
    ...(extended
      ? [
          lesson(
            "Cab, brake and load-system inspection",
            "Assistance systems, air pressure, instruments, body security and load restraints.",
            "Explain and complete all safety-critical commercial-vehicle checks.",
          ),
        ]
      : []),
    ...repeatLesson(
      "Large-vehicle control",
      extended ? 3 : 2,
      "Moving off, transmission use, progressive braking, steering sweep and mirror routines.",
      "Control the vehicle smoothly while continuously accounting for its size.",
    ),
    ...moduleLessons("Proving ground manoeuvres", [
      lesson(
        "straight and offset reversing",
        "Mirror scanning, reference points and low-speed correction in a marked corridor.",
        "Reverse accurately while maintaining clearance on both sides.",
      ),
      lesson(
        "reverse bay parking",
        "Approach setup, steering timing, rear overhang and final alignment.",
        "Place the vehicle safely in the bay without boundary contact.",
      ),
      lesson(
        "gradient start and precision stop",
        "Brake control, transmission preparation and rollback prevention under load.",
        "Move away on a gradient and stop accurately without rollback.",
      ),
      ...(extended
        ? [
            lesson(
              "restricted-space turn",
              "Steering sweep, front and rear overhang and shunting safely.",
              "Reposition the vehicle in limited space with complete observation.",
            ),
          ]
        : []),
    ]),
    ...repeatLesson(
      "Urban goods-vehicle driving",
      3,
      "Blind areas, cyclists, lane width, junction positioning, restrictions and delivery hazards.",
      "Protect vulnerable users and negotiate urban roads without mounting kerbs.",
    ),
    ...repeatLesson(
      "Rural and higher-speed driving",
      extended ? 3 : 2,
      "Braking distance, bends, gradients, overtaking limits and speed management.",
      "Maintain safe progress while accounting for mass and longer stopping distance.",
    ),
    lesson(
      "Load and route operations",
      "Load security check, height and weight restrictions, route choice and safe stopping place.",
      "Verify the load and select a route suitable for the vehicle.",
    ),
    lesson(
      "Emergency and controlled braking",
      "Early hazard response, brake-system limitations and securing after a stop.",
      "Stop promptly under control and make the vehicle safe.",
    ),
    lesson(
      "Independent commercial route",
      "Independent navigation with legal, dimensional and access constraints.",
      "Complete a suitable route without unsafe late changes.",
    ),
    lesson(
      "Mock practical test",
      "Technical checks, proving-ground manoeuvres and a representative road route.",
      "Demonstrate consistent test-standard heavy-vehicle driving.",
    ),
  ];
};

const busPractical = (vehicle, total) => {
  const extended = total === 20;
  return [
    ...basicVehiclePractical(vehicle),
    ...(extended
      ? [
          lesson(
            "Passenger-safety systems inspection",
            "Doors, emergency exits, accessibility equipment, extinguishers and passenger information.",
            "Confirm that passenger and emergency systems are serviceable.",
          ),
        ]
      : []),
    ...repeatLesson(
      "Passenger-vehicle control",
      extended ? 3 : 2,
      "Smooth acceleration, transmission use, wide steering path, mirrors and progressive braking.",
      "Control the vehicle smoothly without compromising passenger comfort.",
    ),
    ...moduleLessons("Proving ground manoeuvres", [
      lesson(
        "straight and offset reversing",
        "Mirror scanning, rear overhang and low-speed alignment.",
        "Reverse accurately while maintaining full clearance.",
      ),
      lesson(
        "reverse bay parking",
        "Approach planning, steering sweep and safe final positioning.",
        "Park inside the bay without boundary or kerb contact.",
      ),
      lesson(
        "gradient start and precision stop",
        "Rollback prevention and accurate, passenger-safe stopping.",
        "Start on a gradient and stop at a defined point smoothly.",
      ),
      ...(extended
        ? [
            lesson(
              "restricted-space turn",
              "Front and rear overhang, swept path and safe shunting.",
              "Reposition the vehicle in limited space with complete observation.",
            ),
          ]
        : []),
    ]),
    ...repeatLesson(
      "Urban passenger service",
      3,
      "Bus lanes, junction positioning, cyclists, crossings, restricted streets and traffic flow.",
      "Negotiate urban traffic safely and predictably.",
    ),
    ...repeatLesson(
      "Stops and passenger comfort",
      2,
      "Approach alignment, door position, accessibility, smooth departure and passenger awareness.",
      "Serve stops accurately without abrupt movement or unsafe door operation.",
    ),
    ...repeatLesson(
      "Rural and higher-speed driving",
      2,
      "Speed, following distance, bends, wind, gradients and passenger comfort.",
      "Make safe progress while preserving stability and comfort.",
    ),
    ...(extended
      ? [
          lesson(
            "Independent passenger route",
            "Route signs, safe stop selection, restrictions and forward planning.",
            "Follow a route independently without sudden or unsuitable manoeuvres.",
          ),
        ]
      : []),
    lesson(
      "Emergency procedures and braking",
      "Passenger communication, evacuation considerations, breakdown positioning and controlled emergency stop.",
      "Protect passengers and other road users during an abnormal event.",
    ),
    lesson(
      "Mock practical test",
      "Safety checks, proving-ground manoeuvres and a representative passenger route.",
      "Demonstrate consistent test-standard passenger-vehicle driving.",
    ),
  ];
};

const agriculturalTheory = (vehicle) => [
  ...moduleLessons("Rules and safe operation", [
    lesson(
      "licence scope and public-road duties",
      `Category scope, documents, road rules and operator responsibility for ${vehicle}.`,
      "Explain where and how the vehicle may be operated legally.",
    ),
    lesson(
      "signs, signals and priority",
      "Signs, markings, junction priority and instructions relevant to slow or unusual vehicles.",
      "Apply traffic controls while accounting for slow acceleration and width.",
    ),
    lesson(
      "speed, positioning and vulnerable users",
      "Road position, following traffic, overtaking risk and protection of pedestrians and riders.",
      "Choose a visible road position and allow safe passing opportunities.",
    ),
  ]),
  ...moduleLessons("Machine safety", [
    lesson(
      "daily inspection",
      "Tyres or tracks, steering, brakes, lights, guards, fluids and warning devices.",
      "Complete a pre-use inspection and isolate unsafe equipment.",
    ),
    lesson(
      "stability and terrain",
      "Centre of gravity, slopes, soft ground, rollover risks and safe travel direction.",
      "Assess terrain and avoid stability limits.",
    ),
    lesson(
      "attachments and power systems",
      "Couplings, hydraulics, power take-off, guards and stored energy.",
      "Connect, use and isolate attachments without exposure to moving or pressurised parts.",
    ),
    lesson(
      "loads and towing",
      "Rated capacity, load balance, trailer security and braking effects.",
      "Keep loads within limits and secure a legal combination.",
    ),
  ]),
  ...moduleLessons("Operational risk", [
    lesson(
      "work areas and bystanders",
      "Exclusion zones, banksman signals, reversing visibility and overhead or underground services.",
      "Plan a work area that separates people from machine movement.",
    ),
    lesson(
      "weather, visibility and road contamination",
      "Lighting, mud, dust, rain, ice and cleaning the road after work.",
      "Adapt operation and prevent avoidable hazards to public traffic.",
    ),
    lesson(
      "breakdowns and emergencies",
      "Safe shutdown, fire, hydraulic failure, rollover response and incident reporting.",
      "Place the machine in a safe state and start the correct emergency response.",
    ),
  ]),
  ...repeatLesson(
    "Theory consolidation and mock test",
    2,
    "Integrated rules, machine safety, attachments and hazard scenarios.",
    "Demonstrate exam-ready decisions and correct weak areas.",
  ),
];

const tractorPractical = [
  ...basicVehiclePractical("tractor"),
  ...moduleLessons("Attachment and trailer handling", [
    lesson(
      "hitching and connections",
      "Safe alignment, hitch points, locking, hydraulics, electrics and PTO isolation.",
      "Attach and detach equipment in a safe sequence.",
    ),
    lesson(
      "load and security check",
      "Axle load, ballast, trailer brakes, guards and load restraint.",
      "Prepare a stable, secure and road-legal combination.",
    ),
  ]),
  ...repeatLesson(
    "Basic tractor control",
    2,
    "Starting, gears or range selection, steering, braking and observation with slow acceleration.",
    "Control speed and direction smoothly without overloading the driveline.",
  ),
  ...moduleLessons("Proving ground manoeuvres", [
    lesson(
      "reversing with trailer",
      "Mirror use, articulation and small corrections in a marked corridor.",
      "Reverse and realign the tractor-trailer combination accurately.",
    ),
    lesson(
      "turning and parking",
      "Wide turns, implement clearance, parking brake and safe shutdown.",
      "Turn in limited space and leave the machine securely parked.",
    ),
  ]),
  lesson(
    "Field-to-road transition",
    "Cleaning, folding and locking equipment, visibility aids and safe road entry.",
    "Prepare the machine for the road and join without depositing hazards.",
  ),
  ...repeatLesson(
    "Public-road tractor driving",
    2,
    "Road position, junctions, gradients, following traffic and safe pull-in choices.",
    "Drive predictably and enable other traffic to pass only when safe.",
  ),
  lesson(
    "Mock practical test",
    "Inspection, attachment checks, proving-ground tasks and public-road driving.",
    "Demonstrate safe independent tractor operation.",
  ),
];

const machineryPractical = [
  ...basicVehiclePractical("mobile machine"),
  ...moduleLessons("Machine controls", [
    lesson(
      "travel controls and braking",
      "Control identification, start sequence, steering modes, service brake and parking brake.",
      "Travel and stop the machine smoothly in its configured travel mode.",
    ),
    lesson(
      "working equipment and safe shutdown",
      "Hydraulic functions, attachment position, neutralisation and stored-energy isolation.",
      "Operate basic functions and leave all equipment in a safe state.",
    ),
  ]),
  ...moduleLessons("Worksite operation", [
    lesson(
      "site assessment and exclusion zone",
      "Ground condition, slopes, services, edges, bystanders and communication.",
      "Define a safe operating area before movement begins.",
    ),
    lesson(
      "controlled work cycle",
      "Positioning, stability, smooth equipment use and maintaining visibility.",
      "Complete a representative work cycle within rated limits.",
    ),
    lesson(
      "reversing with a banksman",
      "Blind areas, agreed signals, alarm use and stopping when visual contact is lost.",
      "Reverse only while the exclusion zone and communication remain effective.",
    ),
  ]),
  ...moduleLessons("Proving ground manoeuvres", [
    lesson(
      "confined route and turning",
      "Width, tail swing, steering mode and clearance through a marked course.",
      "Negotiate the course without boundary contact.",
    ),
    lesson(
      "parking and securing",
      "Level parking, attachment lowering, brake, isolation and safe exit.",
      "Park and isolate the machine so unintended movement is impossible.",
    ),
  ]),
  lesson(
    "Public-road transfer",
    "Travel configuration, lights and beacons, road position, junctions and escorts where required.",
    "Transfer the machine legally and predictably on a public road.",
  ),
  lesson(
    "Abnormal events",
    "Brake or hydraulic warning, instability, fire, contact with services and emergency shutdown.",
    "Recognise an abnormal condition and place the machine in the safest available state.",
  ),
  lesson(
    "Mock practical test",
    "Inspection, controlled work cycle, manoeuvres, securing and road-transfer decisions.",
    "Demonstrate safe independent mobile-machine operation.",
  ),
];

const tramTheory = [
  ...moduleLessons("Tramway rules and responsibility", [
    lesson(
      "authority and operating rules",
      "Driver authority, rule book, fitness, reporting and communication duties.",
      "Explain the limits of authority and required operational communications.",
    ),
    lesson(
      "signals and route indications",
      "Tram signals, points indicators, road signals and priority instructions.",
      "Identify the controlling signal and act correctly on conflicting indications.",
    ),
    lesson(
      "speed and braking distance",
      "Line speeds, rail adhesion, load, gradients and long stopping distances.",
      "Select a speed that permits a safe stop within the visible route.",
    ),
    lesson(
      "road interaction",
      "Mixed traffic, crossings, pedestrians, cyclists and vehicles entering the swept path.",
      "Predict conflicts early and protect the tram’s swept path.",
    ),
  ]),
  ...moduleLessons("Vehicle and infrastructure", [
    lesson(
      "cab preparation and controls",
      "Driving desk, vigilance systems, mirrors or cameras, radio and warning systems.",
      "Set up the cab and prove safety-critical controls.",
    ),
    lesson(
      "doors and passenger systems",
      "Door interlocks, platform interface, accessibility and passenger alarms.",
      "Operate doors only when the platform interface is safe.",
    ),
    lesson(
      "braking and traction systems",
      "Service, emergency and parking brakes, sanding and traction protection.",
      "Choose and test the correct braking system for the situation.",
    ),
    lesson(
      "points, overhead and track",
      "Point position, electrical supply, track defects and infrastructure clearances.",
      "Recognise infrastructure hazards before entering the affected section.",
    ),
  ]),
  ...moduleLessons("Passenger service", [
    lesson(
      "stop approach and departure",
      "Accurate platform alignment, observation, dwell and departure checks.",
      "Serve a stop smoothly and depart only after the platform is clear.",
    ),
    lesson(
      "comfort and accessibility",
      "Smooth acceleration and braking, mobility needs and passenger communication.",
      "Protect standing and mobility-impaired passengers through considerate operation.",
    ),
    lesson(
      "crowding and special events",
      "Capacity, platform crowding, degraded dwell times and operational reporting.",
      "Manage crowded stops without compromising door or platform safety.",
    ),
  ]),
  ...moduleLessons("Abnormal and emergency operation", [
    lesson(
      "low adhesion and weather",
      "Rain, leaves, snow, flooding, glare and reduced visibility on rail.",
      "Adjust braking and speed for degraded adhesion and visibility.",
    ),
    lesson(
      "signal or point failure",
      "Stop-and-report rules, authorisation and restricted movement.",
      "Follow degraded-mode authority without assuming a route is safe.",
    ),
    lesson(
      "obstruction and collision",
      "Protecting the tram, emergency calls, passengers and road traffic.",
      "Secure the scene and coordinate the correct emergency response.",
    ),
    lesson(
      "evacuation and fire",
      "Isolation, safe evacuation side, live equipment and fire response.",
      "Lead evacuation without exposing passengers to traffic or electrical danger.",
    ),
  ]),
  ...moduleLessons("Route knowledge", [
    lesson(
      "gradients, curves and braking points",
      "Permanent features that determine approach speed and stopping strategy.",
      "Recall and apply route-specific control points.",
    ),
    lesson(
      "termini and turnbacks",
      "Reversals, cab changes, point setting and passenger management at route ends.",
      "Complete a safe and efficient turnback under the correct authority.",
    ),
    lesson(
      "depot access and stabling",
      "Depot signals, walking-pace movement, clearances, isolation and secure stabling.",
      "Transition between route and depot operation and leave the tram secured.",
    ),
  ]),
  ...repeatLesson(
    "Theory consolidation and mock test",
    2,
    "Integrated signals, vehicle systems, passenger service and emergency scenarios.",
    "Demonstrate exam-ready tramway decision-making.",
  ),
];

const tramPractical = [
  ...basicVehiclePractical("tram"),
  ...repeatLesson(
    "Basic tram control",
    3,
    "Traction, coasting, braking, stopping accuracy, mirrors or cameras and warning devices.",
    "Control speed and stop position smoothly under normal adhesion.",
  ),
  ...repeatLesson(
    "Depot and proving-ground operation",
    3,
    "Low-speed movement, points, clearances, cab changes, reversing procedure and secure parking.",
    "Move within controlled track areas under the correct authority and secure the tram.",
  ),
  ...repeatLesson(
    "Passenger stops",
    3,
    "Platform approach, precise stopping, door release, accessibility, departure checks and comfort.",
    "Complete the full stop cycle without door or platform risk.",
  ),
  ...repeatLesson(
    "Urban route driving",
    4,
    "Signals, junctions, mixed traffic, swept path, pedestrian prediction and timetable-aware progress.",
    "Operate predictably through increasingly complex street-running conditions.",
  ),
  ...repeatLesson(
    "Special operating situations",
    2,
    "Low adhesion, restricted speed, degraded signals or points and communication with control.",
    "Apply the prescribed degraded-mode procedure without improvising authority.",
  ),
  lesson(
    "Emergency response exercise",
    "Emergency braking, securing, control-room communication, passenger protection and evacuation decision.",
    "Bring an abnormal event to a safe, controlled state.",
  ),
  lesson(
    "Independent route operation",
    "End-to-end route decisions using signals, route knowledge and passenger-service standards.",
    "Operate a representative route independently and consistently.",
  ),
  lesson(
    "Mock practical test",
    "Cab checks, depot movement, passenger stops, public route and abnormal scenario.",
    "Demonstrate test-standard tram operation across the full assessment.",
  ),
];

const curriculumByCategory = {
  AM: {
    theory: motorcycleTheory("moped or light quadricycle"),
    practical: mopedPractical,
  },
  A1: {
    theory: motorcycleTheory("light motorcycle"),
    practical: motorcyclePractical,
  },
  A2: {
    theory: motorcycleTheory("medium motorcycle"),
    practical: motorcyclePractical,
  },
  A: { theory: motorcycleTheory("motorcycle"), practical: motorcyclePractical },
  B: { theory: sharedRoadTheory("passenger car"), practical: carPractical },
  BE: {
    theory: trailerTheory("passenger car"),
    practical: trailerPractical("car and trailer combination"),
  },
  C1: {
    theory: commercialTheory("medium goods vehicle", "Load"),
    practical: goodsPractical("medium goods vehicle", 16),
  },
  C1E: {
    theory: trailerTheory("medium goods vehicle"),
    practical: trailerPractical("medium goods combination", true),
  },
  C: {
    theory: commercialTheory("heavy goods vehicle", "Load"),
    practical: goodsPractical("heavy goods vehicle", 20),
  },
  CE: {
    theory: trailerTheory("heavy goods vehicle"),
    practical: trailerPractical("heavy goods combination", true),
  },
  D1: {
    theory: commercialTheory("minibus", "Passenger"),
    practical: busPractical("minibus", 16),
  },
  D1E: {
    theory: trailerTheory("minibus"),
    practical: trailerPractical("minibus and trailer combination", true),
  },
  D: {
    theory: commercialTheory("bus", "Passenger"),
    practical: busPractical("bus", 20),
  },
  DE: {
    theory: trailerTheory("bus"),
    practical: trailerPractical("bus and trailer combination", true),
  },
  F: { theory: agriculturalTheory("tractor"), practical: tractorPractical },
  G: {
    theory: agriculturalTheory("mobile machinery"),
    practical: machineryPractical,
  },
  T: { theory: tramTheory, practical: tramPractical },
};

/** Build ordered CurriculumLesson inputs and verify category totals before DB writes. */
export function buildCurricula(categories) {
  const knownCodes = new Set(categories.map((category) => category.code));
  const unsupportedCodes = Object.keys(curriculumByCategory).filter(
    (code) => !knownCodes.has(code),
  );
  if (unsupportedCodes.length) {
    throw new Error(
      `Curriculum definitions have no matching category: ${unsupportedCodes.join(", ")}`,
    );
  }

  return categories.flatMap((category) => {
    const curriculum = curriculumByCategory[category.code];
    if (!curriculum)
      throw new Error(
        `Missing curriculum definition for category ${category.code}`,
      );
    if (curriculum.theory.length !== category.theoryLessons) {
      throw new Error(
        `Category ${category.code} requires ${category.theoryLessons} theory lessons, defined ${curriculum.theory.length}`,
      );
    }
    if (curriculum.practical.length !== category.practicalLessons) {
      throw new Error(
        `Category ${category.code} requires ${category.practicalLessons} practical lessons, defined ${curriculum.practical.length}`,
      );
    }

    return [
      ...curriculum.theory.map((item, index) => ({
        categoryCode: category.code,
        sequence: index + 1,
        type: "THEORY",
        durationMinutes: 45,
        ...item,
      })),
      ...curriculum.practical.map((item, index) => ({
        categoryCode: category.code,
        sequence: curriculum.theory.length + index + 1,
        type: "PRACTICAL",
        durationMinutes: 45,
        ...item,
      })),
    ];
  });
}

export { curriculumByCategory };
