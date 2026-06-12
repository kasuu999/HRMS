const Employee = require('../../employee/employee.model');
const { Attendance } = require('../attendance/attendance.model');
const { LeaveRequest, LeaveBalance } = require('../../leave/leave.model');

// Unified Gemini API helper using native fetch
const callGemini = async (systemPrompt, messageOrMessages) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  let contents = [];
  if (typeof messageOrMessages === 'string') {
    contents = [{
      role: 'user',
      parts: [{ text: messageOrMessages }]
    }];
  } else if (Array.isArray(messageOrMessages)) {
    contents = messageOrMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || m.text || '' }]
    }));
  }

  const body = { contents };
  
  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
    throw new Error('Invalid response structure from Gemini API');
  }
  
  return data.candidates[0].content.parts[0].text;
};

// @POST /api/ai/search — Natural language employee search
// e.g. "Find all senior developers in Bangalore on probation"
exports.smartSearch = async (req, res) => {
  try {
    const { query } = req.body;
    const tenantId = req.tenantId;

    // Get available filter options for context
    const [depts, desigs, locs] = await Promise.all([
      Employee.distinct('department', { tenantId }),
      Employee.distinct('designation', { tenantId }),
      Employee.distinct('location', { tenantId }),
    ]);

    // Ask Gemini to parse the query into structured filters
    const systemPrompt = `You are an HRMS query parser. Convert natural language into a JSON MongoDB filter object.

Available fields: firstName, lastName, employmentType (full_time/part_time/contract/intern/probation), status (active/inactive/resigned), skills (array), grade, dateOfJoining.

Rules:
- Return ONLY valid JSON, no explanation, no markdown blocks
- Use $regex for text searches (case-insensitive with $options: "i")  
- Use $in for multiple values
- Date fields use ISO string format
- Example output: {"employmentType": "probation", "status": "active"}`;

    const filterJson = await callGemini(systemPrompt, `Query: "${query}"`);

    let mongoFilter;
    try {
      // Clean possible markdown code blocks from output
      const cleanJson = filterJson.replace(/```json/g, '').replace(/```/g, '').trim();
      mongoFilter = JSON.parse(cleanJson);
    } catch {
      mongoFilter = {};
    }

    // Always enforce tenant isolation
    mongoFilter.tenantId = tenantId;
    mongoFilter.isDeleted = false;

    const employees = await Employee.find(mongoFilter)
      .populate('department', 'name')
      .populate('designation', 'name')
      .populate('location', 'name city')
      .select('firstName lastName employeeId photo department designation location status employmentType')
      .limit(50);

    // Get AI to summarize the results naturally
    const summaryPrompt = `You are an HRMS assistant. Summarize these search results in 1-2 sentences.`;
    const summary = await callGemini(summaryPrompt,
      `Query: "${query}" returned ${employees.length} employees. ${employees.length > 0 ? 'Results found.' : 'No results found.'}`
    );

    res.json({
      success: true,
      data: {
        employees,
        total: employees.length,
        summary,
        parsedFilter: mongoFilter,
      }
    });
  } catch (err) {
    console.error('AI ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/ai/chat — HR Assistant Chatbot
exports.hrChat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const tenantId = req.tenantId;
    const employeeId = req.user.employeeId;

    // Fetch relevant context based on the user's role
    let hrContext = '';

    if (employeeId) {
      const [employee, leaveBalances, todayAttendance] = await Promise.all([
        Employee.findById(employeeId)
          .populate('department', 'name')
          .populate('designation', 'name')
          .select('firstName lastName employeeId department designation status employmentType dateOfJoining'),
        LeaveBalance.find({ tenantId, employeeId, year: new Date().getFullYear() })
          .populate('leaveType', 'name code'),
        Attendance.findOne({ tenantId, employeeId, date: { $gte: new Date().setHours(0,0,0,0) } }),
      ]);

      hrContext = `
Employee Context:
- Name: ${employee?.firstName} ${employee?.lastName} (${employee?.employeeId})
- Department: ${employee?.department?.name}
- Designation: ${employee?.designation?.name}
- Status: ${employee?.status}
- Joined: ${employee?.dateOfJoining?.toDateString()}
- Today's Attendance: ${todayAttendance ? `Punched in at ${todayAttendance.punchIn?.toLocaleTimeString()}` : 'Not punched in'}
- Leave Balances: ${leaveBalances.map(b => `${b.leaveType?.name}: ${b.balance} days`).join(', ') || 'No leave data'}
      `.trim();
    }

    const systemPrompt = `You are an intelligent HR assistant for an HRMS platform. You help employees with HR queries.

${hrContext}

Guidelines:
- Be concise, friendly, and professional
- Answer questions about leave policies, attendance, payroll, company policies
- For sensitive actions (updating bank details, formal complaints), direct to HR
- If you don't have specific policy data, give general guidance
- Keep responses under 150 words unless detailed info is truly needed
- Today's date: ${new Date().toDateString()}`;

    // Build conversation for multi-turn
    const messages = [
      ...conversationHistory.slice(-8), // Keep last 8 turns for context
      { role: 'user', content: message }
    ];

    const reply = await callGemini(systemPrompt, messages);

    res.json({
      success: true,
      data: {
        reply,
        updatedHistory: [
          ...conversationHistory.slice(-8),
          { role: 'user', content: message },
          { role: 'assistant', content: reply },
        ]
      }
    });
  } catch (err) {
    console.error('AI ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/ai/summary/:employeeId — AI-generated employee summary
exports.employeeSummary = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [employee, recentAttendance, leaveBalance] = await Promise.all([
      Employee.findOne({ _id: employeeId, tenantId: req.tenantId })
        .populate('department', 'name')
        .populate('designation', 'name'),
      Attendance.find({ tenantId: req.tenantId, employeeId, date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      LeaveBalance.find({ tenantId: req.tenantId, employeeId, year: new Date().getFullYear() })
        .populate('leaveType', 'name'),
    ]);

    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    const presentDays = recentAttendance.filter(a => a.status === 'present').length;
    const absentDays = recentAttendance.filter(a => a.status === 'absent').length;
    const lateDays = recentAttendance.filter(a => a.isLate).length;

    const prompt = `Generate a brief professional HR summary (3-4 sentences) for this employee:
Name: ${employee.firstName} ${employee.lastName}
Department: ${employee.department?.name}
Designation: ${employee.designation?.name}
Employment Type: ${employee.employmentType}
Joined: ${employee.dateOfJoining?.toDateString()}
Last 30 days - Present: ${presentDays}, Absent: ${absentDays}, Late: ${lateDays}
Leave Balances: ${leaveBalance.map(b => `${b.leaveType?.name}: ${b.balance}`).join(', ')}

Write in third person. Be factual and professional. Note any attendance concerns if applicable.`;

    const summary = await callGemini('You are an HR data analyst.', prompt);

    res.json({
      success: true,
      data: { summary, metrics: { presentDays, absentDays, lateDays } }
    });
  } catch (err) {
    console.error('AI ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};






