const  User  = require('../../model/userModel')
const razorpay = require("razorpay")

let instance = new razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret: process.env.RAZORPAY_SECRET
})


let walletpage =async (req,res)=>{
    
    const userData = await User.findById(req.session.user._id).lean();
    try {
       
        res.render('user/wallet',{userData ,history:userData.history, KEY_ID : process.env.RAZORPAY_ID})
        
    } catch (error) {
        
        console.log(error.message);
    res.status(500).send(" Error");
    }

}


let addMoneyToWallet = async (req, res) => {
    try {

        var options = {
            amount: parseInt(req.body.total) * 100,
            currency: "INR",
            receipt: "" + Date.now(),
        }
        console.log("Creating Razorpay order with options:", options);

        instance.orders.create(options, async function (error, order) {
            if (error) {
                console.log("Error while creating order : ", error);

            }
            else {

                var amount = order.amount / 100
                await User.updateOne(
                    {
                        _id: req.session.user._id
                    },
                    {
                        $push: {
                            history: {
                                amount: amount,
                                status: "credit",
                                date: Date.now()
                            }
                        }
                    }
                )

            }
            res.json({
                order: order,
                razorpay: true
            })
        })


    } catch (error) {
        console.log(error.message);
    res.status(500).send(" Error");

    }
}

const verifyPayment = async (req, res) => {
    try {
        let details = req.body
    
        var amount = parseInt(details.order.order.amount)/100
       
        await User.updateOne(
            {
                _id: req.session.user._id
            },
            {
                $inc: {
                    wallet: amount
                }
            }
        )
        res.json({
            success: true
        })
    } catch (error) {
        console.log("Something went wrong", error);
        res.status(500).send("Internal Server Error");


    }
}


module.exports = {
    walletpage,
    addMoneyToWallet,
    verifyPayment
}