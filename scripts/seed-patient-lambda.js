const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: 5432,
    database: 'qivr',
    user: 'qivr_user',
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const patientEmail = 'patient1762923257212@example.com';
    
    // Get patient and tenant info
    const patientResult = await client.query(
      'SELECT id, tenant_id FROM patients WHERE email = $1 LIMIT 1',
      [patientEmail]
    );
    
    if (patientResult.rows.length === 0) {
      return { statusCode: 404, body: 'Patient not found' };
    }
    
    const { id: patientId, tenant_id: tenantId } = patientResult.rows[0];
    
    // Get provider and template
    const providerResult = await client.query(
      'SELECT id FROM providers WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );
    const providerId = providerResult.rows[0]?.id;
    
    const templateResult = await client.query(
      'SELECT id FROM prom_templates WHERE tenant_id = $1 LIMIT 1',
      [tenantId]
    );
    const templateId = templateResult.rows[0]?.id;
    
    // Insert appointments
    await client.query(`
      INSERT INTO appointments (id, tenant_id, clinic_id, patient_id, provider_id, scheduled_start, scheduled_end, appointment_type, status, location, notes, created_at, updated_at)
      VALUES 
        (gen_random_uuid(), $1, $1, $2, $3, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '30 minutes', 'Follow-up', 'Scheduled', 'Main Clinic', 'Post-surgery check', NOW(), NOW()),
        (gen_random_uuid(), $1, $1, $2, $3, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '45 minutes', 'Consultation', 'Completed', 'Telehealth', 'Initial assessment', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
        (gen_random_uuid(), $1, $1, $2, $3, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '1 hour', 'Physical Exam', 'Completed', 'Main Clinic', 'Annual checkup', NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days')
      ON CONFLICT DO NOTHING
    `, [tenantId, patientId, providerId]);
    
    // Insert PROM if template exists
    if (templateId) {
      const promResult = await client.query(`
        INSERT INTO prom_instances (id, tenant_id, template_id, patient_id, status, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, 'Completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [tenantId, templateId, patientId]);
      
      if (promResult.rows.length > 0) {
        await client.query(`
          INSERT INTO prom_responses (id, tenant_id, prom_instance_id, score, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, 85, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
          ON CONFLICT DO NOTHING
        `, [tenantId, promResult.rows[0].id]);
      }
    }
    
    // Insert message
    if (providerId) {
      await client.query(`
        INSERT INTO messages (id, tenant_id, sender_id, direct_recipient_id, direct_subject, direct_message_type, direct_priority, content, sender_name, sender_role, sent_at, is_read, is_system_message, is_deleted, deleted_by_sender, deleted_by_recipient, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, 'Appointment Reminder', 'Clinical', 'Normal', 'Looking forward to seeing you at your upcoming appointment.', 'Dr. Smith', 'Provider', NOW() - INTERVAL '1 day', false, false, false, false, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING
      `, [tenantId, providerId, patientId]);
    }
    
    await client.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Seeding completed', patientId, tenantId })
    };
  } catch (error) {
    await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
