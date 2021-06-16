const express = require('express')
const app = express()
const router = express.Router()
const {MongoClient} = require('mongodb')
const dBURL = 'mongodb://127.0.0.1:27017'
const mongooseURL = 'mongodb://127.0.0.1:27017/EBA'
const dbName = 'EBA'
const client = new MongoClient(dBURL)
const ErrorHandler = require('./ErrorHandler')
const mongoose = require('mongoose')
const User = require('./userModel')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

app.use(express.json())
app.use(cors())
app.options('*',cors())

const generateJWTToken = async function(email){
    const secretKey = "my-jwt-authetication-secret-key"
    const exprires_in="2 days"
    return await jwt.sign({id:email},secretKey,{expiresIn:exprires_in})

}

const createTour = async (req,res,next )=>{
    console.log("Creating Tour")

    try{
        await client.connect()
        const database = client.db("EBA")
        var tour = database.collection("tour")
        const result = await tour.insertOne(req.body)
        await client.close()
        // console.log(result.ops[0])
        res.status(200).json({
            message:"success",
            result: result.ops[0]
        })
    }
    catch(err){
        next(new ErrorHandler(err.toString() , 405))
    }
}

const getTour = async (req,res,next)=>{
    console.log("Getting Tour with id ",req.params.id)
    collectionName="tour"
    try{
        await client.connect();
        const database = client.db(dbName)
        const tour=database.collection("tour")

        const doc = {tourId:parseInt(req.params.id)}
        const result = await tour.findOne(doc)
        console.log((result))

        // await client.close()
        res.status(200).json({
            message:"success",
            result: result
        })

    }
    catch(err){
        next(new ErrorHandler(err.toString(),404))
    }


}

const updateTour = async (req,res,next)=>{
    console.log("Updating Tour with id ",req.params.id)
    collectionName="tour"
    try{
        await client.connect();
        const database = client.db("EBA")
        const tour=database.collection("tour")

        console.log("req.params.id : ",req.params.id)

        //req.params.id and other input from we pass is string type 
        const filter = {tourId:parseInt(req.params.id)}
        const updateDoc = {
                $set:req.body,
            }

        const result = await tour.updateOne(filter,updateDoc)
        // console.log(result.message.documents)
        // console.log(`${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`)
        // await result.forEach(docX => console.log(docX))
        await client.close()

        res.status(200).send(`Tours with id : ${req.params.id} updated`)
    }
    catch(err){
        console.log(err)
        next(new ErrorHandler(err.toString(),404))

    }
}

const deleteTour = async(req,res,next)=>{
    console.log("Deleting Tour with id ",req.params.id)

    try{
        await client.connect()
        const database = client.db("EBA")
        const tour = database.collection("tour")

        const deleteDoc = {tourId:parseInt(req.params.id)}
        const result = await tour.deleteOne(deleteDoc)
        await client.close()

        res.status(200).send(`Tour with id : ${req.params.id} deleted`)
    }
    catch(err){
        next(new ErrorHandler(err.toString(),400))
    }
}

const createUser = async(req,res,next)=>{
    
    try{
        const userCreated = await User.create(req.body)
        // const secretKey = "my-jtw-authetication-secret-key"
        // const exprires_in="2 days"
        const token = await generateJWTToken(userCreated.email)
        console.log(req.body)
        res.status(200).json({
            status:"Success",
            token:token,
            message:userCreated  
        })
    }
    catch(err){
        next(new ErrorHandler(err.toString(),400))
    }
}

const login = async(req,res,next)=>{

    //Check if Email and password both are missing 
    if(!(req.body.email) || !(req.body.password)){
        next(new ErrorHandler('Please enter email and password. ',400))
    }
    const {email,candidatePassword} = req.body;
    const user = await User.findOne({email})

    // console.log(`candidatePassword : ${req.body.password} | email : ${email} | user.password : ${user['password']}`)

    //1.If user exist 2.Comparing password from user with password stored in DB 
    if(!user || !(await bcrypt.compare(req.body.password, user['password']))){
        return next(new ErrorHandler('Incorrect email or password ',401))
    }

    const token = await generateJWTToken(email)

    res.status(200).json({
        status:"success",
        token:token,
        messages:req.body
    })
}

app.post('/api/v1/tour',createTour)

app.get('/api/v1/tour/:id',getTour)

app.get('/api/v1/tour/',(req,res,next)=>{
    res.json({
        status:"Success",
        result:"This is the Tours app"
    })
})

app.patch('/api/v1/tour/:id',updateTour)

app.delete('/api/v1/tour/:id',deleteTour)

app.post('/api/v1/user',createUser)

app.post('/api/v1/user/login',login)


app.all('*',(req,res,next)=>{
    console.log("Resource not found on server!")
    const err = new Error(`Cant find ${req.originalUrl} on this server`)
    err.status = 'fail';
    err.statusCode = 400;

    next(err);
})


app.use((err,req,res,next) => {
    err.status = err.status || 'Error'
    err.statusCode = err.statusCode || 500
    res.status(err.statusCode).json({
        status:err.status,
        message:err.message
    })
}) 

mongoose.connect(mongooseURL,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false
}).then(con=>{
    // console.log(con.connections)
    console.log('DB connection successful')
})


port = 3000

app.listen(port,()=>{
    console.log(`Application running  at : localhost:${port}`)
})
