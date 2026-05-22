const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()
const cors = require("cors");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const uri = process.env.MONGODB_URI;


const app = express()
const PORT = process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken = async (req,res,next)=> {
  const authHeader = req?.headers.authorization;
console.log("AUTH HEADER:", authHeader);
if(!authHeader){
  return res.status(401).json({message: "unauthorized"});
}

const token = authHeader.split(" ")[1]
console.log("TOKEN:", token);

if(!token){
  return res.status(401).json({message: "unauthorized"});
}


try {
const {payload} = await jwtVerify(token, JWKS)
console.log(payload)
next()
  
} catch (error) {
  return res.status(403).json({message: "Forbidden"});
  
}

}



async function run() {
  try {
    
    // await client.connect();
    const db = client.db("MediQueue")
// destinationCollection=tutorCollection
    const tutorCollection = db.collection("tutors")
    const bookingCollection = db.collection("bookings")
    // const myTutorCollection = db.collection("myTutors")

  
// app.get('/tutor', async (req, res) => {
//   const result = await tutorCollection.find().toArray()
//   res.json(result);
// })

    
    app.post('/tutor',async (req,res)=>{

        const tutorData = req.body
        const result = await tutorCollection.insertOne(tutorData)
        res.json(result)

    })


    app.get("/tutor/:id" ,verifyToken, async (req,res) =>{
        const {id} = req.params

        const result = await tutorCollection.findOne({_id: new ObjectId(id)})
        res.json(result)
    })


    app.patch("/tutor/:id", verifyToken, async (req,res) =>{
        const {id} = req.params
        const updatedData = req.body

        const result = await tutorCollection.updateOne(
            {_id: new ObjectId(id)},
            {$set: updatedData}
        )
        res.json(result)

    })


    app.delete('/tutor/:id',verifyToken, async (req,res) =>{
    
      const {id} = req.params;
      const result = await tutorCollection.deleteOne({_id: new ObjectId(id) })
      res.json(result)

    })


    app.post("/booking", verifyToken,  async(req,res) =>{
        const bookingData = req.body
        const result = await bookingCollection.insertOne(bookingData)
        res.json(result)

    })


app.get("/booking/:userId", verifyToken, async (req, res) => {

    const { userId } = req.params

    const result = await bookingCollection.find({userId:userId}).toArray()

    res.json(result)
})


app.delete('/booking/:bookingId',verifyToken, async (req, res) => {

  const { bookingId } = req.params;
  const result = await bookingCollection.deleteOne({
    _id: new ObjectId(bookingId)
  });

  res.json(result);
});


app.get("/featured" , async(req,res)=>{
  const result = await tutorCollection.find().limit(6).toArray()
  res.json(result)
})


///................... my tutor .................

// 
// app.get("/tutor/user/:userId",verifyToken, async (req, res) => {
//   const { userId } = req.params;

//   const result = await tutorCollection.find({ userId }).toArray();

//   res.json(result);
// });

app.get("/tutor/user/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;

  console.log("PARAM USER ID:", userId);

  const result = await tutorCollection.find({ userId }).toArray();

  console.log("RESULT:", result);

  res.json(result);
});


// ---------slot--------------

app.patch("/tutor/slot/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const tutor = await tutorCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    const totalSlot = Number(tutor.TotalSlot || 0);

    if (totalSlot <= 0) {
      return res.status(400).json({
        message: "Fully booked",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDate = new Date(tutor.SessionStartingDate);
    sessionDate.setHours(0, 0, 0, 0);

    // 🔥 FIXED LOGIC
    if (today > sessionDate) {
      return res.status(400).json({
        message: "Booking not available ",
      });
    }

    await tutorCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { TotalSlot: -1 } }
    );

    res.json({
      success: true,
      message: "Slot updated",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server crashed" });
  }
});




// search.........

app.get("/tutor", async (req, res) => {

  const search = req.query.search || "";

  let query = {};

  if (search) {
    query.TutorName = {
      $regex: search,
      $options: "i",
    };
  }

  const result = await tutorCollection.find(query).toArray();

  res.json(result);
});





    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/',(req,res)=> {
    res.send("server is running fine")
})

app.listen(PORT, ()=>{
    console.log(`server running on port ${PORT}`)
})
