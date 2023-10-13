const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
//const {scheme}=mongoose;


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});
const UserSchema = new mongoose.Schema({ 
  username: String
});
const User = mongoose.model("User",UserSchema);
 
const ExerciseScheme =new mongoose.Schema({
  user_id:{type:String, required: true},
  description:String,
  duration:Number,
  date:Date
});

const Exercise = mongoose.model("Exercise",ExerciseScheme);


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended:true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.get('/api/users',async (req,res)=>{
  const users=await User.find();
  if(!users){
     return res.send("No users found");
  }else{
  res.json(users); }
});

app.post('/api/users',async (req,res)=>{
  const username = req.body.username;
  const newUser = new User({username:username});
  try {
    const data = await newUser.save();
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "An error occurred." });
  }

});

app.post('/api/users/:_id/exercises',async (req,res)=>{
  const id = req.params._id;
  const {description,duration,date} = req.body;
  try{
    const user= await User.findById(id);
    if(!user){
      res.status(404).json({error:"User not found"});
    }
    else{
      const execobj= new Exercise({
        user_id:id,
        description:description,
        duration:duration,
        date:date?new Date(date):new Date()
      })
      const exercise = await execobj.save();
      res.json({
        _id:user._id,
        username:user.username,
        description:exercise.description,
        duration:exercise.duration,
        date:exercise.date.toDateString()
      })
    }
    
  }
  catch(err){
    console.log(err);
    res.status(500).json({ error: "An error occurred." });
  }
  
})

app.get('/api/users/:_id/logs',async (req,res)=>{
  const id = req.params._id;
  const {from,to,limit} = req.query;
  try{
    const user =await User.findById(id);
    if(!user){
      res.status(404).json({error:"User not found"});
    }
    else{
      let filter = {user_id:id};
      if(from){
        filter.date = {$gte:new Date(from)};
      }
      if(to){
        filter.date = {$lte:new Date(to)};
      }
      const exercises = await Exercise.find(filter).limit(+limit ?? 500);

      const log = exercises.map((e)=>({
        description:e.description,
        duration:e.duration,
        date:e.date.toDateString()
      })
                                )

        res.json({
        username:user.username,
        count:exercises.length,
        _id:user._id,
        log:log
        })
    }
  }
  catch(err){
    console.log(err);
    res.status(500).json({ error: "An error occurred." });
  }
})





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
