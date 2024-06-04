const Address = require('../../model/address')
const User    = require('../../model/userModel')
const Order   = require('../../model/order')
const Coupon  = require('../../model/coupon')
const Product = require('../../model/productModel')
const Razorpay = require('razorpay');
const { log } = require('handlebars')
const Category = require('../../model/categoryModel')


const loadCheckout = async (req, res) => {

    const userData = req.session.user
    const userId   = userData._id
    const user = await User.findOne({ _id: userId }).lean()


    const addressData = await Address.find({userId : userId}).lean()

    const userDataa  = await User.findOne({ _id: userId }).populate("cart.product").lean()
    const cart       = userDataa.cart


    let subTotal = 50
    cart.forEach((val)=>{
    val.total = val.product.price * val.quantity
    subTotal += val.total
    })


    const now = new Date();
    const availableCoupons = await Coupon.find({ 
      expiryDate: { $gte: now },
      usedBy: { $nin: [userId] }
    }).lean();
    
        res.render('user/checkout/checkout', { userData:user, cart, addressData, subTotal, availableCoupons })    
}



const checkStock = async (req, res) => {
    const userData = req.session.user;
    const userId = userData._id;
  
  
    const userDataa = await User.findOne({ _id: userId }).populate("cart.product").lean();
    const cart = userDataa.cart;
  
  
    let stock = [];
    cart.forEach((el) => {
      if ((el.product.stock - el.quantity) <= 0) {
        stock.push(el.product);
      }
    });
  
  
    if (stock.length > 0) {
      res.json(stock);
    } else{
        res.json('ok')
    }
  };
  

const loadCheckou = async (req, res) => {

    const userData = req.session.user
    const userId   = userData._id

    console.log(userData.wallet, 'hiiii am from checkout walletttttttttttttttttt');

    const addressData = await Address.find({userId : userId})

    const userDataa  = await User.findOne({ _id: userId }).populate("cart.product").lean()
    const cart       = userDataa.cart

    console.log(cart, 'cart aaaannnnnnnnnnnnnnn')

    let subTotal = 0
    cart.forEach((val)=>{
    val.total = val.product.price * val.quantity
    subTotal += val.total
    })

    let stock = []
      cart.forEach((el) => {
      if((el.product.stock - el.quantity) <= 0){
        stock.push(el.product)
      }
    })

    console.log(stock, 'stockkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk')

    if(stock.length > 0){
        console.log('njana res jssonnnnnnnnnnnnnnnnnnnnn');
        res.json(stock)
    }else{
        console.log('heloooooooooo mann am from stock length');
        res.render('user/checkout/checkout', { userData, cart, addressData, subTotal })
    }    
}


///////////  Place order function /////////////


const placeOrder = async(req, res) => {


    try {  
       const userData  = req.session.user
       const userId    = userData._id
       const addressId = req.body.selectedAddress
       const payMethod = req.body.selectedPayment

       const userDataa = await User.findOne({ _id: userId }).populate("cart.product")
       const cartPro   = userDataa.cart

       let subTotal = 0

       cartPro.forEach((val)=>{
       val.total = val.product.price * val.quantity
       subTotal += val.total
       })


       let productDet = cartPro.map(item => {
        return {
            id       : item.product._id,
            name     : item.product.name,
            price    : item.product.price,
            quantity : item.quantity,
            image    : item.product.imageUrl[0],
        }
       })


       const result  = Math.random().toString(36).substring(2, 7);
       const id      = Math.floor(100000 + Math.random() * 900000);
       const ordeId = result + id;
       
       

       /// order saving function


       let saveOrder = async () => {
        console.log(req.body)
        if(req.body.couponData){
            console.log(req.body)
          const order = new Order({
            userId  : userId,
            product : productDet,
            address : addressId,
            orderId : ordeId,
            total   : subTotal,
            paymentMethod    : payMethod,
            discountAmt      : req.body.couponData.discountAmt,
            amountAfterDscnt : req.body.couponData.newTotal,
            coupon           : req.body.couponName,
        })

        const ordered = await order.save()


        }else{
            const order = new Order({
                userId  : userId,
                product : productDet,
                address : addressId,
                orderId : ordeId,
                total   : subTotal,
                paymentMethod    : payMethod,     
            })
    
            const ordered = await order.save()

        }        

        let userDetails = await User.findById(userId)
        let userCart    = userDetails.cart

        userCart.forEach( async item=> {
            const productId = item.product
            const qty       = item.quantity

            const product       = await Product.findById(productId)
            const stock         = product.stock
            const updatedStock  = stock - qty

            await Product.updateOne(
                { _id: productId },
                { $set: { stock: updatedStock, isOnCart: false },
                 $inc: { bestSelling:1} }
              );
            
                const populatedProd= await Product.findById(productId).populate("category").lean()
                await Category.updateMany({ _id: populatedProd.category._id }, { $inc: { bestselling:1} });

            
              
        })

     
        userDetails.cart = []
        await userDetails.save()
        console.log(userDetails.cart);
      }


       if ( addressId ){
        if( payMethod === 'cash-on-delivery' ){

          saveOrder()

          res.json({ 
            CODsucess : true,
            toal      : subTotal
        }) 
     }



        if(payMethod === 'razorpay'){
              
            const amount = req.body.amount

            var instance = new Razorpay({ 
                key_id: process.env.RAZORPAY_ID   , 
                key_secret: process.env.RAZORPAY_SECRET
             })

            const order = await instance.orders.create({
                amount: amount * 100,
                currency: 'INR',
                receipt: 'Nithina',
            })

            saveOrder()

            res.json({
                razorPaySucess : true,
                order,
                amount, 
            })

            
        }

        /// payment method wallet function


         if ( payMethod === 'wallet' ){
            const newWallet = req.body.updateWallet
            const userData  = req.session.user

             
           await User.findByIdAndUpdate(userId, { $set:{ wallet:newWallet }},  { new : true })


            saveOrder()

            res.json(newWallet)
        }
       }  

       
    } catch (error) {
        console.log(error);
    }
}



const validateCoupon = async (req, res) => {
    try {
        const { couponVal, subTotal } = req.body;
        const coupon = await Coupon.findOne({ code: couponVal });

        if (!coupon) {
            res.json('invalid');
        } else if (coupon.expiryDate < new Date()) {
            res.json('expired');
        } else if (subTotal < coupon.minPurchase) {
            res.json('expired');
        } else {
            const couponId = coupon._id;
            const discount = coupon.discount;
            const userId = req.session.user._id;

            const isCpnAlredyUsed = await Coupon.findOne({ _id: couponId, usedBy: { $in: [userId] } });

            if (isCpnAlredyUsed) {
                res.json('already used');
            } else {
                await Coupon.updateOne({ _id: couponId }, { $push: { usedBy: userId } });

                const discnt = Number(discount);
                let discountAmt = (subTotal * discnt) / 100;
                if (discountAmt > coupon.maxDiscount) {
                    discountAmt = coupon.maxDiscount;
                }
                const newTotal = subTotal - discountAmt;

                const user = User.findById(userId);

                res.json({
                    discountAmt,
                    newTotal,
                    discount,
                    succes: 'succes'
                });
            }
        }
    } catch (error) {
        console.log(error);
    }
};

const applyCoupon = async (req, res) => {
    try {
        const { couponVal, subTotal } = req.body;
        const coupon = await Coupon.findOne({ code: couponVal });
        const userId = req.session.user._id;

        if (!coupon) {
            return res.json({ status: 'invalid' });
        } else if (coupon.expiryDate < new Date()) {
            return res.json({ status: 'expired' });
        } else if (coupon.usedBy.includes(userId)) {
            return res.json({ status: 'already_used' });
        } else if (subTotal < coupon.minPurchase) {
            return res.json({ status: 'min_purchase_not_met' });
        } else {
            // Calculate the discount amount and apply the maximum discount limit
            let discountAmt = (subTotal * coupon.discount) / 100;
            if (discountAmt > coupon.maxDiscount) {
                discountAmt = coupon.maxDiscount;
            }
            const newTotal = subTotal - discountAmt;

            // Add user ID to usedBy array
            await Coupon.updateOne({ _id: coupon._id }, { $push: { usedBy: userId } });

            return res.json({
                discountAmt,
                newTotal,
                discount: coupon.discount,
                status: 'applied'
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: 'error', error });
    }
};



// const removeCoupon = async (req, res) => {
//     try {
//         const { couponVal, subTotal } = req.body;
//         const coupon = await Coupon.findOne({ code: couponVal });
//         const userId = req.session.user._id;

//         if (!coupon) {
//             return res.json({ status: 'invalid' });
//         } else if (!coupon.usedBy.includes(userId)) {
//             return res.json({ status: 'not_used' });
//         } else {
//             // Remove user ID from usedBy array
//             await Coupon.updateOne({ _id: coupon._id }, { $pull: { usedBy: userId } });

//             // Calculate the new total by adding back the discount amount correctly
//             const discountAmt = 0;
//             const newTotal = subTotal;

//             return res.json({
//                 discountAmt,
//                 newTotal,
//                 discount: coupon.discount,
//                 status: 'removed'
//             });
//         }
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ status: 'error', error });
//     }
// };






module.exports = {
    loadCheckout,
    placeOrder,
    // removeCoupon,
    applyCoupon ,
    checkStock,
    validateCoupon,
}