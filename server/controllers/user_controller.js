const { User }  = require('../models')
const { HashingPassword  , ComparePassword   } = require('../helpers/password');
const { Token , TokenVerify} = require('../helpers/token');
const {OAuth2Client} = require('google-auth-library');

class UserController {
    static Register (req,res,next){
        let { username,  password , email } = req.body
        User.create({
            username,  password ,  email
        })
        .then(user=>{
            console.log(Token(user), ' di register biasa')
            console.log('sukses register =====<><><>')
            res.status(201).json({
                token : Token(user),
                user , 
                message : 'sukses add data'
            })
        })
        .catch(err=>{next(err)})
    }

    static Login(req,res,next){
        let {  email , password } = req.body
        console.log('sukses login')
        let kondisi = false
        User.findOne({
            email 
        })
        .then(user=>{
            if(user){
                if(ComparePassword(user.password , password)){
                    kondisi = true
                    // console.log(user)
                    // console.log(Token(user))
                    res.status(201).json({
                        token : Token(user) ,
                        message : user.name + ' Anda Berhasil Login'
                    })
                }else {
                    console.log('here')
                    res.status(403).json({
                        message : 'Email or Password NOT FOUND!!!!!'
                    })
                }
            }else {
                console.log('here')
                res.status(403).json({
                    message : 'Email or Password NOT FOUND!!!!!'
                })
            }
        })
        .catch(err=>{
            console.log('gagal login')
            next(err)
        })
    }

    static RegisterGoogle(req,res,next){
        let data;
        let kondisi = true
        console.log(process.env.AUDIENCE , ' INI PENTING KAAK')
        const client = new OAuth2Client(process.env.AUDIENCE);
        client.verifyIdToken({
            idToken : req.body.id_token ,
            audience :  process.env.AUDIENCE
        })
        .then(ticket=>{
            data = ticket.payload
            return User.findOne({
                email : data.email
            })
        })
        .then(user=>{
            if(user){
                kondisi = false
                let tokenUser = Token(user._id)
                res.json({
                    token : tokenUser,
                    name : user.name
                })
            }else {
                let { name , email } = data
                console.log(data , ' ini yg penting')
                return User.create({
                    username : name , email , password : 'asal'
                })
            }
        })
        .then(data2=>{
            if(kondisi){
                console.log(Token(data2) , ' di register biasa google')
                res.status(201).json({
                    token : Token(data2),
                    data2,
                    message : 'sukses add data'
                })
            }
        })
        .catch(err=>{
            next(err)    
        })
    }
}

module.exports = UserController