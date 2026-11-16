const express = require("express")
const cors = require('cors');
const dotenv = require("dotenv")
const session = require("express-session")
dotenv.config()

const app = express()
const port = process.env.PORT || 5001

const initMongoose = require("./database/init")
const entities = require("./entities");
const subjects = require("./database/models/subjects");
// import initMongoose from "./database/init"
// import entities from "./entities"

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true, // if using sessions or cookies
}));

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}))




app.post("/questions", (req,res)=>{
  console.log("Request for POST /questions")
  console.log("Payload :" ,req.body)

  res.status(501).json({message : "Not yet implemented"})
})


initMongoose().then(()=>{
    console.log("db connected")
    entities(app)
    app.listen(port,()=>{
        console.log(`App listening at port ${port}`)
    })
})

