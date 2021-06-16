const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')


const userSchema = new mongoose.Schema(
    {
        name:{
            type:String
        },
        email:{
            type:String,
            require:true,
            validate:[validator.isEmail,'Please provide a valid Email Id']
        },
        password:{
            type:String,
            require:true
        },
        passwordConfirm:{
            type:String,
            require:true,
            validate:{
                validator:function(el){
                    return el === this.password
                }
            }
        }
    }
);

userSchema.pre('save',async function(next){
    
    this.password = await bcrypt.hash(this.password,12)
    
    this.passwordConfirm = undefined
    next()
})

const User = mongoose.model('users',userSchema)

module.exports = User