const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config()
const cors = require("cors")

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


async function run() {
  try {
    
    await client.connect();
    const db = client.db("MediQueue")
// destinationCollection=tutorCollection
    const tutorCollection = db.collection("tutors")

    const bookingCollection = db.collection("bookings")

  
app.get('/tutor', async (req, res) => {
  const result = await tutorCollection.find().toArray()
  res.json(result);
})

    
    app.post('/tutor',async (req,res)=>{

        const tutorData = req.body
        const result = await tutorCollection.insertOne(tutorData)
        res.json(result)

    })


    app.get("/tutor/:id" , async (req,res) =>{
        const {id} = req.params

        const result = await tutorCollection.findOne({_id: new ObjectId(id)})
        res.json(result)
    })


    app.patch("/tutor/:id", async (req,res) =>{
        const {id} = req.params
        const updatedData = req.body

        const result = await tutorCollection.updateOne(
            {_id: new ObjectId(id)},
            {$set: updatedData}
        )
        res.json(result)

    })


    app.delete('/tutor/:id', async (req,res) =>{
    
      const {id} = req.params;
      const result = await tutorCollection.deleteOne({_id: new ObjectId(id) })
      res.json(result)

    })


    app.post("/booking", async(req,res) =>{
        const bookingData = req.body
        const result = await bookingCollection.insertOne(bookingData)
        res.json(result)

    })


app.get("/booking/:userId", async (req, res) => {

    const { userId } = req.params

    const result = await bookingCollection.find({userId:userId}).toArray()

    res.json(result)
})


app.delete('/booking/:bookingId', async (req, res) => {

  const { bookingId } = req.params;
  const result = await bookingCollection.deleteOne({
    _id: new ObjectId(bookingId)
  });

  res.json(result);
});



    await client.db("admin").command({ ping: 1 });
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
