const userHelper = require('../../helpers/user.helper');
const  User  = require('../../model/userModel');
const argon = require('argon2');


let otp;
let email;



///// submit forgot password request

const submitMailPostProfile=async(req,res)=>{
    try {
        const user=req.session.user;
        const userMail=user.email
        const userData=await User.findOne({email:userMail}).lean()
        if(userData){
            otp=await userHelper.verifyEmail(userMail)
            res.redirect('/profileOtp')
        }else{
            req.session.mailError=true
            res.redirect('/profileOtp')
        }

        
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");        
    }
}

const forgotOtppageProfile=async(req,res)=>{
    try {
        let otpErr = 'Incorrect otp..!!';

        if (req.session.otpErr) {
            console.log("OTP Error:", req.session.otpErr); 
            res.render('user/userResetPassword/submitOtp', { otpErr });
        } else {
            res.render('user/userResetPassword/submitOtp');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}
const forgotOtpSubmitProfile=async(req,res)=>{
    let enteredOtp = req.body.otp;


    if (enteredOtp === otp) {
        res.json({ success: true, redirectUrl: '/profileResetPassword' });
        
    } else {
        req.session.otpErr = true;

        otpError = 'incorrect otp';

        // Send JSON response with error message
        res.json({ error: otpError });
        

    }
}

const resetPasswordPageProfile=async(req,res)=>{
    try {
        res.render('user/userResetPassword/resetPassword');
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }


}
const resetPasswordProfile=async(req,res)=>{
    try {
        const user=req.session.user;
        const userMail=user.email
        const newPassword  = req.body.password
        const hashedPassword = await userHelper.hashPassword(newPassword)
        

        await User.updateOne({ email: userMail }, { $set: { password: hashedPassword } });
        req.session.newPas = true;
        res.redirect('/login');
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }

}

module.exports={
    submitMailPostProfile,
    forgotOtppageProfile,
    forgotOtpSubmitProfile,
    resetPasswordProfile,
    resetPasswordPageProfile
}