import bcrypt from 'bcrypt';
import crypto from 'crypto';

// In-Memory Development Store for CivicEye when local PostGIS is not running
const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
const officerHash = bcrypt.hashSync('OfficerPassword123!', 10);
const citizenHash = bcrypt.hashSync('CitizenPassword123!', 10);

const DEPT_ROADS = '11111111-1111-1111-1111-111111111101';
const DEPT_SANITATION = '11111111-1111-1111-1111-111111111102';
const DEPT_ELECTRICITY = '11111111-1111-1111-1111-111111111103';
const DEPT_DRAINAGE = '11111111-1111-1111-1111-111111111104';

const departments = [
  { id: DEPT_ROADS, name: 'Roads & Bridges', handles: ['pothole', 'damaged_road'] },
  { id: DEPT_SANITATION, name: 'Sanitation & Solid Waste', handles: ['garbage'] },
  { id: DEPT_ELECTRICITY, name: 'Electrical & Street Lighting', handles: ['broken_streetlight'] },
  { id: DEPT_DRAINAGE, name: 'Drainage & Stormwater', handles: ['other'] },
];

const users = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Municipal Administrator',
    email: 'admin@civiceye.gov',
    password_hash: adminHash,
    role: 'admin',
    department_id: null,
    phone: '+91-9876500001',
    city: 'Hyderabad',
    avatar_url: null,
    email_notifications: true,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Rajesh Kumar (Roads Lead)',
    email: 'officer.roads@civiceye.gov',
    password_hash: officerHash,
    role: 'officer',
    department_id: DEPT_ROADS,
    phone: '+91-9876543210',
    city: 'Hyderabad',
    avatar_url: null,
    email_notifications: true,
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Sunita Sharma (Sanitation Lead)',
    email: 'officer.sanitation@civiceye.gov',
    password_hash: officerHash,
    role: 'officer',
    department_id: DEPT_SANITATION,
    phone: '+91-9876543211',
    city: 'Hyderabad',
    avatar_url: null,
    email_notifications: true,
    is_active: true,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Jane Citizen',
    email: 'citizen@civiceye.local',
    password_hash: citizenHash,
    role: 'citizen',
    department_id: null,
    phone: '+91-9988776655',
    city: 'Hyderabad',
    avatar_url: null,
    email_notifications: true,
    is_active: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const refreshTokens = [];
const notifications = [];

// Seeded complaints
const sampleReports = [
  {
    title: 'Severe road crater and deep pothole',
    category: 'pothole',
    status: 'under_review',
    priority: 6,
    area: 'Banjara Hills',
    address: 'Road No. 12, Banjara Hills, Hyderabad',
    lat: 17.4156,
    lng: 78.4357,
    resolved_image_url: null,
    ai_category: 'pothole',
    ai_confidence: 0.94,
    ai_severity: 'high',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  },
  {
    title: 'Overflowing commercial dumpster blocking lane',
    category: 'garbage',
    status: 'in_progress',
    priority: 8,
    area: 'Jubilee Hills',
    address: 'Near Checkpost, Jubilee Hills, Hyderabad',
    lat: 17.4319,
    lng: 78.4073,
    resolved_image_url: null,
    ai_category: 'garbage',
    ai_confidence: 0.88,
    ai_severity: 'high',
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800',
  },
  {
    title: 'Broken streetlight with exposed hanging wire',
    category: 'broken_streetlight',
    status: 'assigned',
    priority: 5,
    area: 'Hitec City',
    address: 'Cyber Towers Junction, Hitec City, Hyderabad',
    lat: 17.4474,
    lng: 78.3762,
    resolved_image_url: null,
    ai_category: 'broken_streetlight',
    ai_confidence: 0.91,
    ai_severity: 'medium',
    image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
  },
  {
    title: 'Damaged asphalt and peeling road surface',
    category: 'damaged_road',
    status: 'resolved',
    priority: 7,
    area: 'Madhapur',
    address: 'Ayyappa Society Main Rd, Madhapur, Hyderabad',
    lat: 17.4483,
    lng: 78.3915,
    resolved_image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800',
    ai_category: 'damaged_road',
    ai_confidence: 0.87,
    ai_severity: 'high',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  },
  {
    title: 'Illegal construction debris dumped on pavement',
    category: 'garbage',
    status: 'submitted',
    priority: 3,
    area: 'Gachibowli',
    address: 'ORR Service Rd, Gachibowli, Hyderabad',
    lat: 17.4401,
    lng: 78.3489,
    resolved_image_url: null,
    ai_category: 'garbage',
    ai_confidence: 0.82,
    ai_severity: 'medium',
    image: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800',
  },
  {
    title: 'Flickering street lamp in dark pedestrian pathway',
    category: 'broken_streetlight',
    status: 'resolved',
    priority: 4,
    area: 'Kukatpally',
    address: 'KPHB Phase 1, Kukatpally, Hyderabad',
    lat: 17.4947,
    lng: 78.3996,
    resolved_image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
    ai_category: 'broken_streetlight',
    ai_confidence: 0.89,
    ai_severity: 'low',
    image: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
  },
  {
    title: 'Substantial sinkhole after storm drain rupture',
    category: 'pothole',
    status: 'in_progress',
    priority: 9,
    area: 'Begumpet',
    address: 'Prakash Nagar, Begumpet, Hyderabad',
    lat: 17.4448,
    lng: 78.4682,
    resolved_image_url: null,
    ai_category: 'pothole',
    ai_confidence: 0.96,
    ai_severity: 'high',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
  },
];

let reportSeq = 100;
const reports = [];
const reportImages = [];
const timeline = [];

// Initialize reports
sampleReports.forEach((s, idx) => {
  const repId = crypto.randomUUID();
  const complaintNo = `CE-2026-${String(idx + 1).padStart(6, '0')}`;
  const daysAgo = (idx + 1) * 3;
  const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const resolvedAt = s.status === 'resolved' ? new Date(Date.now() - (daysAgo - 2) * 86400000).toISOString() : null;

  reports.push({
    id: repId,
    complaint_no: complaintNo,
    user_id: users[3].id,
    title: s.title,
    description: `Reported civic hazard in ${s.area}. Citizens have raised concerns regarding safety and municipal maintenance.`,
    category: s.category,
    status: s.status,
    priority: s.priority,
    address: s.address,
    area: s.area,
    city: 'Hyderabad',
    lat: s.lat,
    lng: s.lng,
    location_source: 'gps',
    ai_status: 'ok',
    ai_category: s.ai_category,
    ai_confidence: s.ai_confidence,
    ai_severity: s.ai_severity,
    ai_detections: [{ class_name: s.category, confidence: s.ai_confidence, bbox: [0.1, 0.1, 0.8, 0.8] }],
    needs_review: idx % 3 === 0,
    assigned_department_id: s.category === 'pothole' || s.category === 'damaged_road' ? DEPT_ROADS : s.category === 'garbage' ? DEPT_SANITATION : DEPT_ELECTRICITY,
    assigned_to: s.status !== 'submitted' ? users[1].id : null,
    duplicate_of: null,
    confirmation_count: Math.floor(Math.random() * 5) + 1,
    resolved_at: resolvedAt,
    resolved_image_url: s.resolved_image_url,
    rejection_reason: null,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
  });

  reportImages.push({
    id: crypto.randomUUID(),
    report_id: repId,
    url: s.image,
    public_id: `mock_${repId}`,
    is_primary: true,
    is_resolution: false,
    created_at: createdAt,
  });

  if (s.resolved_image_url) {
    reportImages.push({
      id: crypto.randomUUID(),
      report_id: repId,
      url: s.resolved_image_url,
      public_id: `mock_res_${repId}`,
      is_primary: false,
      is_resolution: true,
      created_at: resolvedAt,
    });
  }

  timeline.push(
    {
      id: crypto.randomUUID(),
      report_id: repId,
      from_status: null,
      to_status: 'submitted',
      note: 'Complaint filed by citizen with on-site GPS evidence',
      is_internal: false,
      created_at: createdAt,
      changed_by_name: users[3].name,
    },
    {
      id: crypto.randomUUID(),
      report_id: repId,
      from_status: 'submitted',
      to_status: s.status,
      note: s.status === 'resolved' ? 'Municipal team resolved issue on site and attached verification proof' : 'Official triage action initiated',
      is_internal: false,
      created_at: resolvedAt || createdAt,
      changed_by_name: users[1].name,
    }
  );
});

export const mockDb = {
  users,
  departments,
  reports,
  reportImages,
  timeline,
  refreshTokens,
  notifications,

  async query(text, params = []) {
    const sql = typeof text === 'string' ? text.trim() : (text.text || '').trim();

    // 1. Health check
    if (sql.includes('SELECT 1')) {
      return { rows: [{ healthy: 1 }] };
    }

    // 2. Report sequence
    if (sql.includes("nextval('report_seq')")) {
      reportSeq += 1;
      return { rows: [{ seq: reportSeq }] };
    }

    // 3. User lookups
    if (sql.includes('FROM users')) {
      if (sql.includes('WHERE email = $1') || sql.includes('WHERE LOWER(email) = LOWER($1)')) {
        const email = String(params[0] || '').toLowerCase();
        const user = users.find((u) => u.email.toLowerCase() === email);
        return { rows: user ? [{ ...user }] : [] };
      }
      if (sql.includes('WHERE id = $1')) {
        const id = String(params[0]);
        const user = users.find((u) => u.id === id);
        return { rows: user ? [{ ...user }] : [] };
      }
      if (sql.includes('INSERT INTO users')) {
        const [name, email, password_hash, phone, role = 'citizen'] = params;
        const newUser = {
          id: crypto.randomUUID(),
          name,
          email: email.toLowerCase(),
          password_hash,
          phone: phone || null,
          role,
          department_id: null,
          avatar_url: null,
          city: 'Hyderabad',
          email_notifications: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        users.push(newUser);
        return { rows: [{ ...newUser }] };
      }
      if (sql.includes('UPDATE users')) {
        return { rows: users.slice(0, 5) };
      }
      // List users
      return { rows: users.map((u) => ({ ...u, password_hash: undefined })) };
    }

    // 4. Refresh tokens
    if (sql.includes('FROM refresh_tokens') || sql.includes('INSERT INTO refresh_tokens')) {
      if (sql.includes('INSERT INTO refresh_tokens')) {
        const [userId, tokenHash, expiresAt] = params;
        refreshTokens.push({
          id: crypto.randomUUID(),
          user_id: userId,
          token_hash: tokenHash,
          expires_at: expiresAt,
          revoked_at: null,
          created_at: new Date().toISOString(),
        });
        return { rows: [] };
      }
      if (sql.includes('WHERE token_hash = $1')) {
        const tokenHash = params[0];
        const record = refreshTokens.find((t) => t.token_hash === tokenHash && !t.revoked_at);
        return { rows: record ? [record] : [] };
      }
      if (sql.includes('UPDATE refresh_tokens')) {
        return { rows: [] };
      }
    }

    // 5. Departments
    if (sql.includes('FROM departments')) {
      if (sql.includes('WHERE id = $1')) {
        const dept = departments.find((d) => d.id === params[0]);
        return { rows: dept ? [dept] : [] };
      }
      return { rows: [...departments] };
    }

    // 6. Analytics aggregations
    if (sql.includes('avg_resolution_hours') || sql.includes('FILTER (WHERE status') || sql.includes('ST_SnapToGrid') || sql.includes('date_trunc') || sql.includes('total_analyzed') || sql.includes('accuracy_percentage') || sql.includes('avg_hours') || sql.includes('open_count')) {
      if (sql.includes('avg_resolution_hours')) {
        return {
          rows: [
            {
              total: reports.length,
              open: reports.filter((r) => r.status !== 'resolved' && r.status !== 'rejected').length,
              resolved: reports.filter((r) => r.status === 'resolved').length,
              rejected: reports.filter((r) => r.status === 'rejected').length,
              needs_review: reports.filter((r) => r.needs_review).length,
              high_priority: reports.filter((r) => r.priority >= 5).length,
              avg_resolution_hours: 28.5,
            },
          ],
        };
      }
      if (sql.includes('ST_SnapToGrid') || sql.includes('ST_Centroid')) {
        return {
          rows: reports.map((r) => ({
            lat: r.lat,
            lng: r.lng,
            total: r.priority || 1,
          })),
        };
      }
      if (sql.includes('date_trunc')) {
        return {
          rows: [
            { date: '2026-11-01', total: 3, resolved: 2 },
            { date: '2026-11-02', total: 4, resolved: 3 },
            { date: '2026-11-03', total: 2, resolved: 2 },
            { date: '2026-11-04', total: 5, resolved: 4 },
            { date: '2026-11-05', total: 6, resolved: 5 },
            { date: '2026-11-06', total: 7, resolved: 6 },
          ],
        };
      }
      if (sql.includes('open_count')) {
        const areaCounts = {};
        reports.forEach((r) => {
          areaCounts[r.area] = (areaCounts[r.area] || 0) + 1;
        });
        return {
          rows: Object.entries(areaCounts).map(([area, cnt]) => ({
            area,
            total: cnt,
            open_count: Math.ceil(cnt * 0.6),
            resolved_count: Math.floor(cnt * 0.4),
          })),
        };
      }
      if (sql.includes('avg_hours')) {
        return {
          rows: [
            { category: 'pothole', avg_hours: 24.5, resolved_count: 5 },
            { category: 'garbage', avg_hours: 12.0, resolved_count: 8 },
            { category: 'broken_streetlight', avg_hours: 18.2, resolved_count: 6 },
            { category: 'damaged_road', avg_hours: 48.0, resolved_count: 3 },
          ],
        };
      }
      if (sql.includes('total_analyzed') || sql.includes('accuracy_percentage')) {
        return {
          rows: [
            {
              total_analyzed: 45,
              accurate_count: 41,
              accuracy_percentage: 91.1,
            },
          ],
        };
      }
    }

    if (sql.includes('GROUP BY category')) {
      const counts = {};
      reports.forEach((r) => {
        counts[r.category] = (counts[r.category] || 0) + 1;
      });
      return {
        rows: Object.entries(counts).map(([cat, c]) => ({ category: cat, count: c, total: c, accurate: c, match_rate: 92.5 })),
      };
    }

    if (sql.includes('GROUP BY status')) {
      const counts = {};
      reports.forEach((r) => {
        counts[r.status] = (counts[r.status] || 0) + 1;
      });
      return {
        rows: Object.entries(counts).map(([st, c]) => ({ status: st, count: c })),
      };
    }

    // 7. Reports (detail & list)
    if (sql.includes('FROM reports')) {
      // 6a. Single report detail by ID or complaint_no
      if (sql.includes('WHERE r.id = $1') || sql.includes('WHERE r.complaint_no = $1') || sql.includes('WHERE id = $1')) {
        const key = params[0];
        const r = reports.find((item) => item.id === key || item.complaint_no === key);
        if (!r) return { rows: [] };

        const citizen = users.find((u) => u.id === r.user_id) || users[3];
        const dept = departments.find((d) => d.id === r.assigned_department_id);
        const officer = users.find((u) => u.id === r.assigned_to);

        const enriched = {
          ...r,
          lat: r.lat,
          lng: r.lng,
          citizen_id: citizen.id,
          citizen_name: citizen.name,
          citizen_email: citizen.email,
          citizen_phone: citizen.phone,
          department_id: dept?.id || null,
          department_name: dept?.name || null,
          assigned_to_name: officer?.name || null,
          primary_image_url: r.resolved_image_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
        };
        return { rows: [enriched] };
      }

      // 6b. Count matching reports
      if (
        (sql.startsWith('SELECT COUNT') || sql.includes('COUNT(*) AS total') || sql.includes('COUNT(*)::int AS total')) &&
        !sql.includes('r.complaint_no') &&
        !sql.includes('r.title') &&
        !sql.includes('avg_resolution_hours') &&
        !sql.includes('FILTER')
      ) {
        return { rows: [{ total: reports.length, count: reports.length }] };
      }

      // 6c. Insert report
      if (sql.includes('INSERT INTO reports')) {
        const newRep = {
          id: crypto.randomUUID(),
          complaint_no: params[0] || `CE-2026-${String(reportSeq).padStart(6, '0')}`,
          user_id: params[1] || users[3].id,
          title: params[2] || 'Reported Issue',
          description: params[3] || '',
          category: params[4] || 'pothole',
          lng: params[5] || 78.4357,
          lat: params[6] || 17.4156,
          address: params[7] || 'Metro City',
          area: params[8] || 'Central',
          city: params[9] || 'Hyderabad',
          location_source: params[10] || 'gps',
          status: 'submitted',
          priority: 3,
          ai_status: params[11] || 'ok',
          ai_category: params[12] || params[4],
          ai_confidence: params[13] || 0.85,
          ai_severity: params[14] || 'medium',
          ai_detections: [],
          needs_review: params[16] === true,
          confirmation_count: 1,
          resolved_at: null,
          resolved_image_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        reports.unshift(newRep);
        return { rows: [newRep] };
      }

      // 6d. Update report
      if (sql.includes('UPDATE reports')) {
        const id = params[params.length - 1];
        const rep = reports.find((r) => r.id === id);
        if (rep) {
          if (sql.includes('status = $')) rep.status = params[0];
          if (sql.includes('resolved_image_url = $')) rep.resolved_image_url = params[0];
          if (sql.includes('priority = $')) rep.priority = Number(params[0]);
          if (sql.includes('category = $')) rep.category = params[0];
          if (sql.includes('assigned_department_id = $')) rep.assigned_department_id = params[0];
          rep.updated_at = new Date().toISOString();
        }
        return { rows: rep ? [rep] : [] };
      }

      // 6e. List / Search reports
      const enrichedReports = reports.map((r) => {
        const citizen = users.find((u) => u.id === r.user_id) || users[3];
        const dept = departments.find((d) => d.id === r.assigned_department_id);
        const officer = users.find((u) => u.id === r.assigned_to);
        const img = reportImages.find((im) => im.report_id === r.id);
        return {
          ...r,
          lat: r.lat,
          lng: r.lng,
          citizen_id: citizen.id,
          citizen_name: citizen.name,
          citizen_email: citizen.email,
          department_id: dept?.id || null,
          department_name: dept?.name || null,
          assigned_to_name: officer?.name || null,
          primary_image_url: img?.url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
          image_count: 1,
        };
      });

      return { rows: enrichedReports };
    }

    // 7. Report images
    if (sql.includes('FROM report_images') || sql.includes('INSERT INTO report_images')) {
      if (sql.includes('INSERT INTO report_images')) {
        const newImg = {
          id: crypto.randomUUID(),
          report_id: params[0],
          url: params[1],
          public_id: params[2] || 'mock_pub',
          is_primary: params[3] === true,
          created_at: new Date().toISOString(),
        };
        reportImages.push(newImg);
        return { rows: [newImg] };
      }
      if (sql.includes('WHERE report_id = $1')) {
        const repId = params[0];
        const images = reportImages.filter((im) => im.report_id === repId);
        return { rows: images };
      }
    }

    // 8. Timeline (report_status_history)
    if (sql.includes('FROM report_status_history') || sql.includes('INSERT INTO report_status_history')) {
      if (sql.includes('INSERT INTO report_status_history')) {
        const newEv = {
          id: crypto.randomUUID(),
          report_id: params[0],
          from_status: params[1],
          to_status: params[2],
          changed_by: params[3],
          note: params[4] || '',
          is_internal: params[5] === true,
          created_at: new Date().toISOString(),
          changed_by_name: 'Official Team',
        };
        timeline.push(newEv);
        return { rows: [newEv] };
      }
      if (sql.includes('report_id = $1')) {
        const repId = params[0];
        const events = timeline.filter((e) => e.report_id === repId);
        return { rows: events };
      }
    }

    // 8b. Confirmations
    if (sql.includes('FROM report_confirmations')) {
      return { rows: [] };
    }

    // Default fallback
    return { rows: [] };
  },
};

export default mockDb;
