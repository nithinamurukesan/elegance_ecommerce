const express = require('express');
const router = express.Router();
const auth = require('../middleware/userAuth')
const userController = require('../controller/user/userController')
const forgetPassword = require('../controller/user/forgetPassword')
const profile = require('../controller/user/profile')
const cart = require('../controller/user/cart')
const checkout = require('../controller/user/checkout')
const orders = require('../controller/user/orders')
const wishlist = require('../controller/user/wishlist');
const resetProfile = require('../controller/user/resetProfilePassword')
const wallet=require('../controller/user/walletController')
const review=require('../model/reviewModel')

require('../middleware/googleAuth')
const passport = require('passport')





const { isLogin, isLogout, blockCheck: isBlocked, logedin } = auth



//google authentication

router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }))
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), userController.googleCallback)




router.get('/', userController.loadHome)
router.post('/', userController.doLogin)


//shop page
router.get('/product',  userController.getProduct)
router.post('/search',userController.searchAndSort)

//product view
router.get('/productview',  userController.ProductView)

//review
router.post('/addReview', logedin, isBlocked, userController.addNewReviewPost)



router.get('/login', isLogout, userController.userLogin)

router.get('/logout', userController.doLogout)
router.get('/signup', isLogout, userController.usersignup)
router.post('/signup', userController.doSignup)

//about page
router.get('/about', userController.aboutpage )

//contact page
router.get('/contact', userController.contactpage )

router.get('/get_otp', isLogout, userController.getOtp)
router.post('/submit_otp', userController.submitOtp)

router.get('/resend_otp', isLogout, userController.resendOtp)

router.get('/profile', logedin, isBlocked, profile.loadProfile)
router.get('/adresses', logedin, isBlocked, profile.manageAddress)
router.get('/add_new_adress', logedin, isBlocked, profile.addNewAddress)
router.post('/add_new_adress', logedin, isBlocked, profile.addNewAddressPost)
router.get('/edit_address/:id', logedin, isBlocked, profile.editAddress)
router.post('/edit_address/:id', logedin, isBlocked, profile.editAddressPost)
router.get('/edit_details', logedin, isBlocked, profile.editDetails)
router.post('/update_details/:id', logedin, isBlocked, profile.updateDetails)
router.get('/delete_address/:id', logedin, isBlocked, profile.deleteAddress)

// forgot password
router.get('/forget_passsword', isLogout, forgetPassword.submitMail)
router.post('/forget_password', forgetPassword.submitMailPost)


router.get('/otp', isLogout, forgetPassword.submitOtp)
router.post('/otp', forgetPassword.submitOtpPost)

router.get('/reset_password', isLogout, forgetPassword.resetPassword)
router.post('/reset_password', forgetPassword.resetPasswordPost)


//profile reset password

router.get('/changePassword', logedin, resetProfile.submitMailPostProfile)
router.get('/profileOtp', logedin, resetProfile.forgotOtppageProfile)
router.post('/profileOtp', logedin, resetProfile.forgotOtpSubmitProfile)
router.get('/profileResetPassword', logedin, resetProfile.resetPasswordPageProfile)
router.post('/profileResetPassword', logedin, resetProfile.resetPasswordProfile)




//cart
router.get('/cart', logedin, isBlocked, cart.loadCart)
router.get('/add_to_cart', logedin, isBlocked, cart.addToCart)
router.get('/remove', isLogin, isBlocked, cart.removeCart)
router.post('/cart_updation', logedin, isBlocked, cart.updateCart)

//checkout
router.get('/checkout', logedin, isBlocked, checkout.loadCheckout)
router.get('/check_stock', logedin, isBlocked, checkout.checkStock)
router.post('/place_order', logedin, isBlocked, checkout.placeOrder)
router.post('/checkoutaddress', logedin, isBlocked, checkout.addNewAddressPost)


//orders

router.get('/my_orders', logedin, isBlocked, orders.myOrders)
router.get('/order_details', logedin, isBlocked, orders.orderDetails)
router.get('/order_sucess', logedin, isBlocked, orders.orderSuccess)
// router.post('/cancel_order', logedin, isBlocked, orders.cancelOrder)
// router.get('/return_order', logedin, isBlocked, orders.returnOrder)


router.get('/get_invoice', logedin, isBlocked, orders.getInvoice)

router.get('/wishlist', logedin, isBlocked, wishlist.loadWishlist)
router.get('/add_to_wishlist', logedin, isBlocked, wishlist.addToWishList)
router.get('/remove_from_wishlist', logedin, isBlocked, wishlist.removeFromWishList)


router.post('/validate_coupon', logedin, isBlocked, checkout.validateCoupon)

// router.post('/apply_coupon', logedin, isBlocked, checkout.applyCoupon);


//wallet

router.get('/wallet', logedin, isBlocked,wallet.walletpage)
router.post('/addmoneytowallet', logedin, isBlocked,wallet.addMoneyToWallet)
router.post('/verify_Payment', logedin, isBlocked,wallet.verifyPayment)


router.put('/cancel-order/:id', orders.cancelOrder);

// Return entire order
router.put('/return-order/:id', orders.returnOrder);

// Cancel one product in an order
router.put('/cancel-one-product', orders.cancelOneProduct);

router.put('/return-one-product', orders.returnOneProduct);

























































// router.post("/api/payment/verify",(req,res)=>{

//     let body=req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;

//      var crypto = require("crypto");
//      var expectedSignature = crypto.createHmac('sha256','BHpzGbf03O8ttvTONBk2LokC')
//       .update(body.toString())
//       .digest('hex');
//       console.log("sig received " ,req.body.response.razorpay_signature);
//       console.log("sig generated " ,expectedSignature);
//      var response = {"signatureIsValid":"false"}
//      if(expectedSignature === req.body.response.razorpay_signature)
//       response={"signatureIsValid":"true"}
//          res.send(response);
//      });









module.exports = router;
