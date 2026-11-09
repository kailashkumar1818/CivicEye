import bcrypt from 'bcrypt';
import pg from 'pg';
import env from '../src/config/env.js';
import logger from '../src/utils/logger.js';
import { formatComplaintId } from '../src/utils/complaintId.js';

const BCRYPT_ROUNDS = 10; // 10 rounds for rapid seeding

const LOCALITIES = [
  { area: 'Banjara Hills', lat: 17.4156, lng: 78.4357 },
  { area: 'Jubilee Hills', lat: 17.4319, lng: 78.4073 },
  { area: 'Hitec City', lat: 17.4474, lng: 78.3762 },
  { area: 'Madhapur', lat: 17.4483, lng: 78.3915 },
  { area: 'Gachibowli', lat: 17.4401, lng: 78.3489 },
  { area: 'Kukatpally', lat: 17.4947, lng: 78.3996 },
  { area: 'Begumpet', lat: 17.4448, lng: 78.4682 },
  { area: 'Secunderabad', lat: 17.4399, lng: 78.4983 },
  { area: 'Charminar Old City', lat: 17.3616, lng: 78.4747 },
  { area: 'Ameerpet', lat: 17.4375, lng: 78.4483 },
];

const ISSUE_TEMPLATES = [
  {
    category: 'pothole',
    titles: [
      'Deep dangerous pothole near intersection',
      'Cracked road crater causing motorcycle accidents',
      'Series of waterlogged potholes after monsoon rain',
      'Sunken asphalt depression near bus stop',
      'Dangerous road cavity damaging vehicle tires',
    ],
    severity: ['medium', 'high', 'high', 'medium', 'low'],
  },
  {
    category: 'garbage',
    titles: [
      'Illegal municipal garbage dump overflowing onto sidewalk',
      'Uncollected organic waste rotting by marketplace',
      'Construction debris and discarded concrete blocking lane',
      'Commercial plastic refuse dumped in open vacant plot',
      'Overflowing neighborhood trash bin attracting stray animals',
    ],
    severity: ['high', 'medium', 'medium', 'high', 'low'],
  },
  {
    category: 'broken_streetlight',
    titles: [
      'Streetlight pole flickering intermittently at dark corner',
      'Completely dead streetlight creating unsafe pedestrian stretch',
      'Fallen streetlight post with exposed wiring',
      'Broken glass casing and hanging bulb on main road',
      'Solar street light non-functional for past two weeks',
    ],
    severity: ['medium', 'high', 'high', 'low', 'medium'],
  },
  {
    category: 'damaged_road',
    titles: [
      'Severe asphalt peeling and gravel erosion',
      'Road cave-in near storm drain junction',
      'Unfinished pipeline trench left unpaved for weeks',
      'Uneven speed breaker lacking warning paint or signage',
      'Eroded road shoulders posing rollover hazard',
    ],
    severity: ['high', 'high', 'high', 'medium', 'medium'],
  },
  {
    category: 'other',
    titles: [
      'Missing manhole cover on pedestrian footpath',
      'Fallen tree branch blocking bicycle lane',
      'Clogged rainwater drainage grate causing road flooding',
      'Damaged road divider curb dislodged onto traffic lane',
    ],
    severity: ['high', 'medium', 'high', 'low'],
  },
];

const SAMPLE_IMAGE_URLS = {
  pothole: [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
  ],
  garbage: [
    'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
  ],
  broken_streetlight: [
    'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
  ],
  damaged_road: [
    'https://images.unsplash.com/photo-1584463699037-77b5a8e0cb20?w=800&auto=format&fit=crop&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
  ],
};

async function seed() {
  const client = new pg.Client({
    connectionString: env.DATABASE_URL,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    logger.info('Connected to PostgreSQL for full database seeding');

    // 1. Seed standard municipal departments
    const departments = [
      { name: 'Roads & Bridges', handles: ['pothole', 'damaged_road'] },
      { name: 'Sanitation & Solid Waste', handles: ['garbage'] },
      { name: 'Electricity & Streetlighting', handles: ['broken_streetlight'] },
      { name: 'Drainage & Water Works', handles: ['other'] },
    ];

    const deptMap = {};
    for (const dept of departments) {
      const res = await client.query(
        `INSERT INTO departments (name, handles)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET handles = EXCLUDED.handles
         RETURNING id, name`,
        [dept.name, dept.handles]
      );
      deptMap[dept.name] = res.rows[0].id;
    }
    logger.info('Departments seeded');

    // 2. Seed Admin user
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', BCRYPT_ROUNDS);
    const adminRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role, city)
       VALUES ($1, $2, $3, 'admin', 'Metro City')
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = 'admin'
       RETURNING id`,
      ['Central Admin', 'admin@civiceye.gov', adminPasswordHash]
    );
    const adminId = adminRes.rows[0].id;
    logger.info('Default admin account ready: admin@civiceye.gov');

    // 3. Seed Field Officers
    const officerPasswordHash = await bcrypt.hash('OfficerPassword123!', BCRYPT_ROUNDS);
    const officers = [
      { name: 'Inspector Ramesh Kumar', email: 'officer.roads@civiceye.gov', dept: 'Roads & Bridges' },
      { name: 'Supervisor Priya Sharma', email: 'officer.sanitation@civiceye.gov', dept: 'Sanitation & Solid Waste' },
    ];
    const officerIds = [];
    for (const off of officers) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role, department_id, city, phone)
         VALUES ($1, $2, $3, 'officer', $4, 'Metro City', '+91-9876543210')
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = 'officer',
           department_id = EXCLUDED.department_id
         RETURNING id`,
        [off.name, off.email, officerPasswordHash, deptMap[off.dept]]
      );
      officerIds.push(res.rows[0].id);
    }
    logger.info('Field officers seeded');

    // 4. Seed Citizens (5 accounts)
    const citizenPasswordHash = await bcrypt.hash('CitizenPassword123!', BCRYPT_ROUNDS);
    const citizens = [
      { name: 'Jane Citizen', email: 'citizen@civiceye.local', phone: '+91-9988776655' },
      { name: 'Arjun Reddy', email: 'arjun.reddy@gmail.com', phone: '+91-9848022338' },
      { name: 'Sneha Patel', email: 'sneha.patel@yahoo.com', phone: '+91-9700112233' },
      { name: 'Mohammed Farooq', email: 'm.farooq@outlook.com', phone: '+91-9949887766' },
      { name: 'Kavitha Rao', email: 'kavitha.rao@gmail.com', phone: '+91-9849123456' },
    ];

    const citizenIds = [];
    for (const c of citizens) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role, city, phone)
         VALUES ($1, $2, $3, 'citizen', 'Metro City', $4)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = 'citizen'
         RETURNING id`,
        [c.name, c.email, citizenPasswordHash, c.phone]
      );
      citizenIds.push(res.rows[0].id);
    }
    logger.info('Citizen accounts seeded (Primary: citizen@civiceye.local)');

    // 5. Seed 55+ realistic civic reports across 30 days
    logger.info('Seeding 55 civic complaints with GIS coordinates, status timelines, and AI metrics...');
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const statuses = [
      'submitted', 'submitted',
      'under_review', 'under_review',
      'assigned', 'assigned', 'assigned',
      'in_progress', 'in_progress', 'in_progress',
      'resolved', 'resolved', 'resolved', 'resolved', 'resolved',
      'rejected',
    ];

    for (let i = 1; i <= 55; i++) {
      // Pick random template
      const catGroup = ISSUE_TEMPLATES[i % ISSUE_TEMPLATES.length];
      const category = catGroup.category;
      const title = catGroup.titles[i % catGroup.titles.length];
      const severity = catGroup.severity[i % catGroup.severity.length];

      // Pick locality with small coordinate jitter (~100-300m)
      const loc = LOCALITIES[i % LOCALITIES.length];
      const jitterLat = (Math.random() - 0.5) * 0.015;
      const jitterLng = (Math.random() - 0.5) * 0.015;
      const lat = loc.lat + jitterLat;
      const lng = loc.lng + jitterLng;

      // Status & Days ago
      const status = statuses[i % statuses.length];
      const daysAgo = Math.floor(Math.random() * 28) + 1;
      const createdAt = new Date(now - daysAgo * DAY_MS);
      let resolvedAt = null;
      if (status === 'resolved') {
        const resolutionHours = Math.floor(Math.random() * 72) + 6;
        resolvedAt = new Date(createdAt.getTime() + resolutionHours * 3600 * 1000);
      }

      // Department assignment
      let assignedDeptId = null;
      if (category === 'pothole' || category === 'damaged_road') {
        assignedDeptId = deptMap['Roads & Bridges'];
      } else if (category === 'garbage') {
        assignedDeptId = deptMap['Sanitation & Solid Waste'];
      } else if (category === 'broken_streetlight') {
        assignedDeptId = deptMap['Electricity & Streetlighting'];
      } else {
        assignedDeptId = deptMap['Drainage & Water Works'];
      }

      // AI attributes
      const aiConfidence = parseFloat((0.65 + Math.random() * 0.32).toFixed(2));
      const needsReview = i % 7 === 0; // 1 in 7 needs review
      const citizenId = citizenIds[i % citizenIds.length];
      const assignedOfficerId = status !== 'submitted' && status !== 'under_review' ? officerIds[i % officerIds.length] : null;

      // Generate sequence
      const seqRes = await client.query("SELECT nextval('report_seq') AS seq");
      const complaintNo = formatComplaintId(seqRes.rows[0].seq);
      const confirmations = Math.floor(Math.random() * 6) + 1;
      const priority = confirmations + (severity === 'high' ? 3 : severity === 'medium' ? 1 : 0);

      const insertSql = `
        INSERT INTO reports (
          complaint_no, user_id, title, description, category,
          location, address, area, city, location_source,
          status, priority,
          ai_status, ai_category, ai_confidence, ai_severity, ai_detections, needs_review,
          assigned_department_id, assigned_to, confirmation_count,
          resolved_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8, $9, 'Metro City', 'gps',
          $10, $11,
          'ok', $12, $13, $14, $15, $16,
          $17, $18, $19,
          $20, $21, $22
        ) RETURNING id
      `;

      const repRes = await client.query(insertSql, [
        complaintNo,
        citizenId,
        title,
        `Civic inspection report filed via citizen mobile application regarding ${title.toLowerCase()} in ${loc.area}. Requires municipal intervention.`,
        category,
        lng,
        lat,
        `Near Plot ${i * 4}, Main Road, ${loc.area}`,
        loc.area,
        status,
        priority,
        category,
        aiConfidence,
        severity,
        JSON.stringify([{ box_2d: [100, 150, 400, 500], label: category, score: aiConfidence }]),
        needsReview,
        assignedDeptId,
        assignedOfficerId,
        confirmations,
        resolvedAt,
        createdAt,
        resolvedAt || createdAt,
      ]);

      const reportId = repRes.rows[0].id;

      // Primary photo
      const sampleImgs = SAMPLE_IMAGE_URLS[category] || SAMPLE_IMAGE_URLS.other;
      const imageUrl = sampleImgs[i % sampleImgs.length];
      await client.query(
        `INSERT INTO report_images (report_id, url, public_id, is_primary, created_at)
         VALUES ($1, $2, $3, true, $4)`,
        [reportId, imageUrl, `civiceye/seed_${i}`, createdAt]
      );

      // Status history chain
      await client.query(
        `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal, created_at)
         VALUES ($1, NULL, 'submitted', $2, 'Initial complaint submission', false, $3)`,
        [reportId, citizenId, createdAt]
      );

      if (status !== 'submitted') {
        const reviewDate = new Date(createdAt.getTime() + 2 * 3600 * 1000);
        await client.query(
          `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal, created_at)
           VALUES ($1, 'submitted', 'under_review', $2, 'Preliminary officer screening and category verification', false, $3)`,
          [reportId, adminId, reviewDate]
        );
      }

      if (status === 'assigned' || status === 'in_progress' || status === 'resolved') {
        const assignDate = new Date(createdAt.getTime() + 6 * 3600 * 1000);
        await client.query(
          `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal, created_at)
           VALUES ($1, 'under_review', 'assigned', $2, 'Dispatched to zonal field team for inspection', false, $3)`,
          [reportId, adminId, assignDate]
        );
      }

      if (status === 'in_progress' || status === 'resolved') {
        const workDate = new Date(createdAt.getTime() + 18 * 3600 * 1000);
        await client.query(
          `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal, created_at)
           VALUES ($1, 'assigned', 'in_progress', $2, 'Repair crew deployed on-site with equipment', false, $3)`,
          [reportId, assignedOfficerId || adminId, workDate]
        );
      }

      if (status === 'resolved' && resolvedAt) {
        await client.query(
          `INSERT INTO report_status_history (report_id, from_status, to_status, changed_by, note, is_internal, created_at)
           VALUES ($1, 'in_progress', 'resolved', $2, 'Municipal work completed and inspected. Hazard cleared.', false, $3)`,
          [reportId, assignedOfficerId || adminId, resolvedAt]
        );
      }
    }

    logger.info('Database seeded successfully with 55 complaints, history, and metrics!');
  } catch (err) {
    logger.error({ err: err.message }, 'Seed process failed');
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
