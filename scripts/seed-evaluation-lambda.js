const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: 5432,
    database: 'qivr',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const tenantId = 'd1466419-46e4-4594-b6d9-523668431e06';
    
    // Get or create patient
    let patientResult = await client.query(
      'SELECT id FROM users WHERE tenant_id = $1 AND role = $2 LIMIT 1',
      [tenantId, 'Patient']
    );
    
    let patientId;
    if (patientResult.rows.length === 0) {
      const newPatientId = require('crypto').randomUUID();
      await client.query(`
        INSERT INTO users (id, tenant_id, cognito_id, email, first_name, last_name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [newPatientId, tenantId, 'test-patient-' + newPatientId, 'testpatient@example.com', 'Test', 'Patient', 'Patient']);
      patientId = newPatientId;
    } else {
      patientId = patientResult.rows[0].id;
    }
    
    // Insert evaluation
    const evalId = require('crypto').randomUUID();
    const evalNumber = 'EVAL-' + new Date().toISOString().slice(0,10).replace(/-/g, '') + '-001';
    
    await client.query(`
      INSERT INTO evaluations (
        id, tenant_id, patient_id, evaluation_number, chief_complaint, 
        symptoms, medical_history, questionnaire_responses, status, urgency, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    `, [
      evalId,
      tenantId,
      patientId,
      evalNumber,
      'Lower back pain',
      JSON.stringify(['Back pain', 'Stiffness', 'Limited mobility']),
      JSON.stringify({}),
      JSON.stringify({}),
      'Pending',
      'Medium'
    ]);
    
    await client.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Evaluation created',
        evalId,
        patientId
      })
    };
  } catch (error) {
    console.error('Error:', error);
    await client.end();
    throw error;
  }
};
