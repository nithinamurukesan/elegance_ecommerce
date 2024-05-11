const userHelper = require('../../helpers/user.helper');
const  User  = require('../../model/userModel');
const argon = require('argon2');


let otp;
let email;

/////////render forgot otp mail page

const submitMailProfile= async(req,res)=>{
    try {

        const mailError='Invalid User'
        if (req.session.mailError) {
            res.render('user/userResetPassword/mailSubmit',{mailError})
            req.session.mailError=false

            
        } else {
            res.render('user/userResetPassword/mailSubmit')
            
        }
        
        
    } catch (error) {
        console.log(error)
    }
}

///// submit forgot password request

const submitMailPostProfile=async(req,res)=>{
    try {
        email=req.body.email
        const userData=await User.findOne({email:email}).lean()
        console.log(userData)
        if(userData){
            otp=await userHelper.verifyEmail(email)
            console.log(otp)
            res.redirect('/profileOtp')
        }else{
            req.session.mailError=true
            res.redirect('/changePassword')
        }

        
    } catch (error) {
        console.log(error)
        
    }
}

const forgotOtppageProfile=async(req,res)=>{
    try {
        let otpErr = 'Incorrect otp..!!';

        if (req.session.otpErr) {
            console.log("OTP Error:", req.session.otpErr); // Debugging statement
            res.render('user/userResetPassword/submitOtp', { otpErr });
        } else {
            res.render('user/userResetPassword/submitOtp');
        }
    } catch (error) {
        console.log(error);
    }
}
const forgotOtpSubmitProfile=async(req,res)=>{
    let enteredOtp = req.body.otp;

    console.log("Entered OTP:", enteredOtp); // Debugging statement
    console.log("Stored OTP:", otp); // Debugging statement

    if (enteredOtp === otp) {
        res.redirect('/profileResetPassword');
    } else {
        req.session.otpErr = true;
        console.log("Incorrect OTP. Redirecting to /otp"); // Debugging statement
        res.redirect('/profileOtp');
    }
}

const resetPasswordPageProfile=async(req,res)=>{
    try {
        res.render('user/userResetPassword/resetPassword');
    } catch (error) {
        console.log(error);
    }


}
const resetPasswordProfile=async(req,res)=>{
    try {
        const newPassword  = req.body.password
        const hashedPassword = await userHelper.hashPassword(newPassword)
        //hashedPassword = await userHelper.hashpassword(req.body.password);

        await User.updateOne({ email: email }, { $set: { password: hashedPassword } });
        req.session.newPas = true;
        res.redirect('/login');
    } catch (error) {
        console.log(error);
    }

}

module.exports={
    submitMailProfile,
    submitMailPostProfile,
    forgotOtppageProfile,
    forgotOtpSubmitProfile,
    resetPasswordProfile,
    resetPasswordPageProfile
}