const Employee = require('../../employee/employee.model');
const { Attendance } = require('../attendance/attendance.model');
const { LeaveRequest, LeaveBalance } = require('../../leave/leave.model');
// Import Location model (defined in org.model.js)
const { Location } = require('../../employee/org.model');

const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HF_TOKEN);


// Gemini + HuggingFace Helper
const callAI = async (systemPrompt, messageOrMessages) => {

  try {

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini key missing");
    }


    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`;


    let contents = [];


    if (typeof messageOrMessages === "string") {

      contents = [
        {
          role: "user",
          parts: [
            {
              text: messageOrMessages
            }
          ]
        }
      ];

    } else {

      contents = messageOrMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: m.content || ""
          }
        ]
      }));

    }



    const body = {
      contents
    };


    if(systemPrompt){

      body.systemInstruction = {
        parts:[
          {
            text:systemPrompt
          }
        ]
      };

    }



    const response = await fetch(url,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(body)
    });



    const data = await response.json();


    if(data.error){
      throw new Error(data.error.message);
    }



    return data.candidates[0]
      .content
      .parts[0]
      .text;



  } catch(error){


    console.log(
      "Gemini failed, using HuggingFace"
    );


    let prompt = "";


    if(typeof messageOrMessages === "string"){

      prompt = messageOrMessages;

    }else{

      prompt = messageOrMessages
        .map(m => m.content)
        .join("\n");

    }



    const result = await hf.chatCompletion({

     model:"meta-llama/Llama-3.1-8B-Instruct",


      messages:[

        {
          role:"system",
          content:
          systemPrompt || "You are HR assistant"
        },

        {
          role:"user",
          content:prompt
        }

      ],


      max_tokens:300

    });



    return result.choices[0].message.content;

  }

};




// Natural language employee search
exports.smartSearch = async (req,res)=>{

try{


const {query}=req.body;

const tenantId=req.tenantId;


const [depts,desigs,locs]=await Promise.all([
Employee.distinct('department',{tenantId}),
Employee.distinct('designation',{tenantId}),
Employee.distinct('location',{tenantId})
]);



const systemPrompt = `
You are an HRMS query parser.
Convert natural language into JSON MongoDB filter.

Return only JSON.
No markdown.
`;



const filterJson = await callAI(
systemPrompt,
`Query: "${query}"`
);



  let mongoFilter;

  try{
    mongoFilter =
      JSON.parse(
        filterJson.replace(/```json/g,'')
        .replace(/```/g,'')
        .trim()
      );
  }catch{
    mongoFilter = {};
  }

  mongoFilter.tenantId = tenantId;
  mongoFilter.isDeleted = false;

  // Convert location name (string) to ObjectId if present
  if (mongoFilter.location && typeof mongoFilter.location === 'string') {
    const locDoc = await Location.findOne({
      name: new RegExp(`^${mongoFilter.location}$`, 'i'),
      tenantId,
    });
    if (locDoc) {
      mongoFilter.location = locDoc._id;
    } else {
      // No matching location – remove filter to avoid cast error
      delete mongoFilter.location;
    }
  }

  const employees = await Employee.find(mongoFilter)
    .limit(50)
    .populate('location', 'name');


const summary =
await callAI(
"You are HR assistant",
`Found ${employees.length} employees`
);



res.json({

success:true,

data:{
employees,
total:employees.length,
summary,
parsedFilter:mongoFilter
}

});


}catch(err){

console.log(err);

res.status(500).json({
success:false,
message:err.message
});

}

};
// HR Assistant Chatbot
exports.hrChat = async (req,res)=>{

try{


const {message,conversationHistory=[]}=req.body;

const tenantId=req.tenantId;

const employeeId=req.user.employeeId;



let hrContext="";



if(employeeId){


const [employee,leaveBalances,todayAttendance] =
await Promise.all([


Employee.findById(employeeId)
.populate('department','name')
.populate('designation','name')
.select(
'firstName lastName employeeId department designation status employmentType dateOfJoining'
),


LeaveBalance.find({
tenantId,
employeeId,
year:new Date().getFullYear()
})
.populate('leaveType','name code'),



Attendance.findOne({
tenantId,
employeeId,
date:{
$gte:new Date().setHours(0,0,0,0)
}
})


]);



hrContext = `

Employee Context:

Name:
${employee?.firstName} ${employee?.lastName}

Employee ID:
${employee?.employeeId}

Department:
${employee?.department?.name}

Designation:
${employee?.designation?.name}

Status:
${employee?.status}

Joined:
${employee?.dateOfJoining?.toDateString()}

Today's Attendance:
${todayAttendance
? "Punched in"
: "Not punched in"
}


Leave Balance:

${
leaveBalances
.map(
b =>
`${b.leaveType?.name}: ${b.balance} days`
)
.join(", ")
}

`;

}



const systemPrompt = `

You are an intelligent HR assistant.

${hrContext}


Rules:

- Answer HR questions
- Be friendly
- Keep answers short
- Guide user to HR for sensitive actions

`;





const messages=[

...conversationHistory.slice(-8),

{
role:"user",
content:message
}

];





const reply =
await callAI(
systemPrompt,
messages
);



res.json({

success:true,

data:{

reply,

updatedHistory:[

...conversationHistory.slice(-8),

{
role:"user",
content:message
},

{
role:"assistant",
content:reply
}

]

}

});



}catch(err){


console.log("AI ERROR:",err);


res.status(500).json({

success:false,

message:err.message

});


}


};







// Employee Summary
exports.employeeSummary = async (req,res)=>{


try{


const {employeeId}=req.params;



const [employee,recentAttendance,leaveBalance]=
await Promise.all([


Employee.findOne({
_id:employeeId,
tenantId:req.tenantId
})
.populate('department','name')
.populate('designation','name'),



Attendance.find({

tenantId:req.tenantId,

employeeId,

date:{
$gte:new Date(
Date.now()-
30*24*60*60*1000
)

}

}),



LeaveBalance.find({

tenantId:req.tenantId,

employeeId,

year:new Date().getFullYear()

})
.populate('leaveType','name')

]);





if(!employee){

return res.status(404).json({

success:false,

message:"Employee not found"

});

}




const presentDays =
recentAttendance.filter(
a=>a.status==="present"
).length;



const absentDays =
recentAttendance.filter(
a=>a.status==="absent"
).length;



const lateDays =
recentAttendance.filter(
a=>a.isLate
).length;





const prompt = `


Generate professional HR summary.


Name:
${employee.firstName}
${employee.lastName}


Department:
${employee.department?.name}


Designation:
${employee.designation?.name}


Employment:
${employee.employmentType}


Present:
${presentDays}


Absent:
${absentDays}


Late:
${lateDays}


Leave:
${
leaveBalance
.map(
b=>`${b.leaveType?.name}: ${b.balance}`
)
.join(", ")
}


`;




const summary =
await callAI(
"You are HR data analyst",
prompt
);





res.json({

success:true,

data:{

summary,

metrics:{

presentDays,

absentDays,

lateDays

}

}

});





}catch(err){


console.log("AI ERROR:",err);


res.status(500).json({

success:false,

message:err.message

});


}


};