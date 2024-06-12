const Orders  = require('../../model/order')
const Address = require('../../model/address')
const moment  = require('moment')
const pdfkit  = require('pdfkit')
const fs      = require('fs')
const helper  = require('../../helpers/user.helper')
const User    = require('../../model/userModel')
const Product = require('../../model/productModel')


const path = require('path');
const easyinvoice = require('easyinvoice');
const Handlebars = require('handlebars');
const { handlebars } = require('hbs')
const mongoose = require('mongoose')
const ObjectId = require('mongoose')









// const myOrders = async (req, res) => {
//   try {
//     var page = 1
//     if(req.query.page){
//       page = req.query.page
//     }
//     const limit = 3;

//       const userData = req.session.user
//       const userId   = userData._id

//       const orders = await Orders.aggregate([
//         {
//           $match: {userId}
//         },
//         {
//           $sort:{ date: -1 }
//         },
//         {
//           $skip: (page - 1) * limit
//         },
//         {
//           $limit: limit * 1
//         }
//       ]);
                                
//       const count = await Orders.find({}).count();
//       const totalPages = Math.ceil(count/limit)  // Example value
//       const pages = Array.from({length: totalPages}, (_, i) => i + 1);

//       const formattedOrders = orders.map(order => {
//           const formattedDate = moment(order.date).format('MMMM D, YYYY');
//           return { ...order.toObject(), date: formattedDate }
//       })

//       console.log(formattedOrders);

//       res.render('user/my_orders', {
//           userData,
//           myOrders: formattedOrders || [],
//           pages , currentPage: page,
//       })

//   } catch (error) {
//       console.log(error);
//   }
// }

const myOrders = async (req, res) => {
  try {
    var page = 1
    if(req.query.page){
      page = req.query.page
    }
    const limit = 6;
      const userData = req.session.user
      const userId   = userData._id

      const orders = await Orders.find({ userId })
                                  .sort({ date: -1 })
                                  .skip((page - 1) * limit)
                                  .limit(limit * 1)
    const count = await Orders.find({userId}).count();
    const totalPages = Math.ceil(count/limit)
    const pages = Array.from({length: totalPages}, (_, i) => i + 1); 

      const formattedOrders = orders.map(order => {
          const formattedDate = moment(order.date).format('MMMM D, YYYY');
          return { ...order.toObject(), date: formattedDate }
      })

      console.log(formattedOrders);

      res.render('user/my_orders', {
          userData,
          myOrders: formattedOrders || [],
          pages , currentPage: page 
      })

  } catch (error) {
    console.log(error.message);
    res.status(500).send(" Error");  }
}






const filterOrders = async (req, res) => {

  try {
    const { orderType } = req.query
    const userData = req.session.user
    const userId   = userData._id

    const orders = await Orders.find({ userId, status: orderType })
                                .sort({ date: -1 })

    const formattedOrders = orders.map(order => {
        const formattedDate = moment(order.date).format('MMMM D, YYYY');
        return { ...order.toObject(), date: formattedDate }
    })

    console.log(formattedOrders);

    res.json(formattedOrders)

  } catch (error) {
    console.log(error.message);
    res.status(500).send(" Error");  }
}


//  const orderDetails = async(req, res) => {
//     try {
//         const user = req.session.user
//         const userId   = user._id
//         const userData = await User.findById(userId).lean()
//         // const userDataObject = userData.toObject();
//         console.log(userData)

//         const orderId = req.query.id

//         const myOrderDetails = await Orders.findById(orderId).lean()
//         const orderedProDet  = myOrderDetails.product
//         const addressId      = myOrderDetails.address

//         const address        = await Address.findById(addressId).lean()

//         console.log(myOrderDetails);
       
//         res.render('user/order_Details', { myOrderDetails, orderedProDet, userData, address })
//     } catch (error) {
//         console.log(error);
//     }
//  }


const orderDetails = async (req, res) => {
  try {
      let ct = 0
      let ct2 = 0
      const orderId = req.query.id;
      const user = req.session.user;
      const userId = user._id;
      let offerprice=0



      // Retrieve user data
      const userData = await User.findById(userId).lean();

      // Retrieve order details including populated address
      const myOrderDetails = await Orders.findById(orderId).populate('address').lean();
      console.log(myOrderDetails)
      // let hasReturnedItems = myOrderDetails.product.some(product => product.isReturned);
      // let allCancelled = myOrderDetails.product.every(product => product.isCancelled);
      // let allReturned = myOrderDetails.product.every(product => product.isReturned);
      await myOrderDetails.product.forEach((product) => {
          if (product.isReturned) {
              ct++
          }
          if (product.isCancelled) ct2++
      })
      let check = function (a, b) {
          if (a + b === myOrderDetails.product.length) {
              return true
          } else {
              return false
          }
      }

      if (check(ct, ct2) && ct>0  && myOrderDetails.status !== "Returned") {
          await Orders.findByIdAndUpdate(myOrderDetails._id, { $set: { status: 'Returned' } }, { new: true });
          myOrderDetails.status = "Returned";
      }
          if(check(ct2,ct) &&ct==0 &&ct2>0 && myOrderDetails.status !== "Cancelled"){
              await Orders.findByIdAndUpdate(myOrderDetails._id, { $set: { status: 'Cancelled' } }, { new: true });
              myOrderDetails.status = "Cancelled";
          }
          
      

     // myOrderDetails.allCancelled = allCancelled;
     // myOrderDetails.allReturned = allReturned;

      if (!myOrderDetails) {
          return res.status(404).send("Order not found");
      }

      // Retrieve ordered product details
      const orderedProDet = await Orders.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
          { $unwind: "$product" },
          {
              $project: {
                  _id: 1,
                  id:1,
                  product: 1
              }
          }
      ]);
      const address=await Address.findOne(
          {
              userId:userId
          }
      ).lean()
      

    
      //console.log("orderedProDet:", orderedProDet);
      await myOrderDetails.product.forEach((product) => {
        if (product.isReturned) {
            ct++
        }
        if (product.isCancelled) ct2++
        offerprice+= product.price* product.quantity
    })
    offerprice-=myOrderDetails.discountAmt  

    const formattedDate = moment(myOrderDetails.date).format("MMMM D, YYYY");

      res.render('user/order_Details', { offerprice,address,orderedProDet, myOrderDetails, userData,formattedDate });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(" Error");
  }
};




 const orderSuccess = (req, res) => {
    try {
      const userData = req.session.user
        res.render('user/order_sucess', {userData})
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
 }


//  const cancelOrder = async(req, res) => {
//     try {
//         const id       = req.query.id
//         const userData = req.session.user
//         const userId   =  userData._id
        
//         const { updateWallet, payMethod } = req.body
//         console.log(updateWallet)

//         if(payMethod === 'wallet' || payMethod === 'razorpay'){
//           await User.findByIdAndUpdate( userId, { $set:{ wallet:updateWallet }}, { new:true })
//         }

//         await Orders.findByIdAndUpdate(id, { $set: { status: 'Cancelled' } }, { new: true });

//         res.json('sucess')
//     } catch (error) {
//         console.log(error);
//     }
//  }



 
//  const returnOrder = async(req, res) => {
//     try {
//         const id = req.query.id
//         console.log(id)
//         await Orders.findByIdAndUpdate(id, { $set: { status: 'Returned' } }, { new: true });

//         res.json('sucess')
//     } catch (error) {
//         console.log(error);
//     }
//  }


const cancelOrder = async (req, res) => {
  try {
      const id = req.params.id;
      console.log(id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid order ID' });
      }

      const ID = new mongoose.Types.ObjectId(id);
      let notCancelledAmt = 0;
      let updatedwallet=0;

      let canceledOrder = await Orders.findOne({ _id: ID });

      if (!canceledOrder) {
          return res.status(404).json({ error: 'Order not found' });
      }

      await Orders.updateOne({ _id: ID }, { $set: { status: 'Cancelled' } });

      for (const product of canceledOrder.product) {
          if (!product.isCancelled) {
              await Product.updateOne(
                  { _id: product._id },
                  { $inc: { stock: product.quantity }, $set: { isCancelled: true } }
              );

              await Orders.updateOne(
                  { _id: ID, 'product._id': product._id },
                  { $set: { 'product.$.isCancelled': true } }
              );
          }


      }

      if (['wallet', 'razorpay'].includes(canceledOrder.paymentMethod)) {
          //for (const data of canceledOrder) {
              //await Product.updateOne({ _id: data._id }, { $inc: { stock: data.quantity } });
              console.log(canceledOrder.amountAfterDscnt)
              if(canceledOrder.couponUsed){
                 updatedwallet = canceledOrder.amountAfterDscnt 

              }
              else{
                 updatedwallet = canceledOrder.total
              }
              
              notCancelledAmt = updatedwallet 
             for (const data of canceledOrder.product) {
                
                if(data.isCancelled===true || data.isReturned === true){
                    updatedwallet -= data.price * data.quantity
                }
             }
             console.log(updatedwallet, "updated after review")
              await User.updateOne(
                  { _id: req.session.user._id },
                  { $inc: { wallet:  updatedwallet} }
              );
            //   notCancelledAmt += canceledOrder.price * canceledOrder.quantity;
         // }

         

          await User.updateOne(
              { _id: req.session.user._id },
              {
                  $push: {
                      history: {
                          amount: notCancelledAmt,
                          status: 'refund for Order Cancellation',
                          date: Date.now()
                      }
                  }
              }
          );
      }

      res.json({
          success: true,
          message: 'Successfully cancelled Order'
      });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(" Error");
  }
};

// Return entire order
const returnOrder = async (req, res) => {
  try {
      const id = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid order ID' });
      }
      const ID = new mongoose.Types.ObjectId(id);
      let notCancelledAmt = 0;
      let updatedwallet=0;

      let returnedOrder = await Orders.findOne({ _id: ID }).lean();
      console.log(returnedOrder, "returnedOrder")

      const returnedorder = await Orders.findByIdAndUpdate(ID, { $set: { status: 'Returned' } }, { new: true });
      for (const product of returnedorder.product) {
          if (!product.isCancelled) {
              await Product.updateOne(
                  { _id: product._id },
                  { $inc: { stock: product.quantity } }
              );

              await Orders.updateOne(
                  { _id: ID, 'product._id': product._id },
                  { $set: { 'product.$.isReturned': true } }
              );
          }


      }
      if (['wallet', 'razorpay'].includes(returnedOrder.paymentMethod)) {
        //   for (const data of returnedOrder.product) {
              //await Product.updateOne({ _id: data._id }, { $inc: { stock: data.quantity } });
              if(returnedOrder.couponUsed){
                updatedwallet = returnedOrder.amountAfterDscnt 

             }
             else{
                updatedwallet = returnedOrder.total
             }
             
             notCancelledAmt = updatedwallet 
              for (const data of returnedOrder.product) {
                
                if(data.isCancelled===true || data.isReturned === true){
                    updatedwallet -= data.price * data.quantity
                }
             }
              await User.updateOne(
                  { _id: req.session.user._id },
                  { $inc: { wallet: updatedwallet } }
              );
              

          await User.updateOne(
              { _id: req.session.user._id },
              {
                  $push: {
                      history: {
                          amount: notCancelledAmt,
                          status: 'refund of Order Return',
                          date: Date.now()
                      }
                  }
              }
          );
      }

      res.json({
          success: true,
          message: 'Successfully Returned Order'

      });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(" Error");
  }
};

// Cancel one product in an order
const cancelOneProduct = async (req, res) => {
  try {
      const { id, prodId } = req.body;
      console.log(id, prodId)

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
          return res.status(400).json({ error: 'Invalid order or product ID' });
      }

      const ID = new mongoose.Types.ObjectId(id);
      const PRODID = new mongoose.Types.ObjectId(prodId);

      const updatedOrder = await Orders.findOneAndUpdate(
          { _id: ID, 'product.id': PRODID },
          { $set: { 'product.$.isCancelled': true } },
          { new: true }
      ).lean();

      if (!updatedOrder) {
          return res.status(404).json({ error: 'Order or product not found' });
      }

      const result = await Orders.findOne(
          { _id: ID, 'product.id': PRODID },
          { 'product.$': 1 }
      ).lean();

      const productQuantity = result.product[0].quantity;
      const productprice = result.product[0].price * productQuantity

      await Product.findOneAndUpdate(
          { _id: PRODID },
          { $inc: { stock: productQuantity } }
      );

      await User.updateOne(
        { _id: req.session.user._id },
        {
            $inc:{
                wallet:productprice
            }
        }
    );
      await User.updateOne(
          { _id: req.session.user._id },
          {
              $push: {
                  history: {
                      amount: productprice,
                      status: `refund of: ${result.product[0].name}`,
                      date: Date.now()
                  }
              }
          }
      );

      res.json({
          success: true,
          message: 'Successfully removed product'
      });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(" Error");
  }
};
const returnOneProduct = async (req, res) => {
  try {
    console.log("-----------------------------start")
      const { id, prodId } = req.body;
      console.log(id, prodId)

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
          return res.status(400).json({ error: 'Invalid order or product ID' });
      }

      const ID = new mongoose.Types.ObjectId(id);
      const PRODID = new mongoose.Types.ObjectId(prodId);

      const updatedOrder = await Orders.findOneAndUpdate(
          { _id: ID, 'product.id': PRODID },
          { $set: { 'product.$.isReturned': true } },
          { new: true }
      ).lean();

      if (!updatedOrder) {
          return res.status(404).json({ error: 'Order or product not found' });
      }

      const result = await Orders.findOne(
          { _id: ID, 'product.id': PRODID },
          { 'product.$': 1 }
      ).lean();

      const productQuantity = result.product[0].quantity;

      const productprice = result.product[0].price * productQuantity
      console.log(productQuantity,productprice,"productpriceproductpriceproductprice")

      await Product.findOneAndUpdate(
          { _id: PRODID },
          { $inc: { stock: productQuantity } }
      );
      await User.updateOne(
        { _id: req.session.user._id },
        {
            $inc:{
                wallet:productprice
            }
        }
    );
      await User.updateOne(
          { _id: req.session.user._id },
          {
              $push: {
                  history: {
                      amount: productprice,
                      status: `Return Order refund of: ${result.product[0].name}`,
                      date: Date.now()
                  }
              }
          }
      );
      console.log("-----------------------------end")

      res.json({
          success: true,
          message: 'Successfully removed product'
      });
  } catch (error) {
    console.log(error.message);
    res.status(500).send(" Error");
  }
}




//  const getInvoice = async (req, res) => {
//   try {
//     const orderId = req.query.id; 
   
  

//     const order = await Orders.findById(orderId);
//     if (!order) {
//       return res.status(404).send({ message: 'Order not found' });
//     }

//     const { userId, address: addressId } = order;
    
//     const [user, address] = await Promise.all([
//       User.findById(userId),
//       Address.findById(addressId),
//     ]);


//     const products = order.product.map((product) => ({
//       quantity: product.quantity.toString(),
//       description: product.name,
//       tax: 0,
//       price: product.price,
//     }));
//     console.log(products)

//     const date = moment(order.date).format('MMMM D, YYYY');
    
    


//     if (!user || !address) {
//       return res.status(404).send({ message: 'User or address not found' });
//     }

//     const filename = `invoice_${orderId}.pdf`;

//     const data = {
//       mode: "development",
//       currency: 'USD',
//       taxNotation: 'vat',
//       marginTop: 25,
//       marginRight: 25,
//       marginLeft: 25,
//       marginBottom: 25,
//       background: 'https://public.easyinvoice.cloud/img/watermark-draft.jpg',
//       sender: {
//         company: 'SHOPIFY',
//         address: 'Canyon',
//         zip: '600091',
//         city: 'Chennai',
//         country: 'India',
//       },
//       client: {
//         company: user.name,
//         address: address.adressLine1,
//         zip: address.pin,
//         city: address.city,
//         country: 'India',
//       },

//       information: {
//         // Invoice number
//         number: "2021.0001",
//         // Invoice data
//         date: date,
//         // Invoice due date
//         // duedate: "31-12-2021"
//     },
  
//       // invoiceNumber: '2023001',
//       // invoiceDate: date,


//       products: products
     
//     };

//     console.log(data)

// easyinvoice.createInvoice(data, function (result) {

//   easyinvoice.createInvoice(data, function (result) {
//     const fileName = 'invoice.pdf'
//     const pdfBuffer = Buffer.from(result.pdf, 'base64');
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
//     res.send(pdfBuffer);
//   })
//   console.log('PDF base64 string: ');
// });
// } 
   
//    catch (error) {
//     res.sendStatus(500);
//   }
// };

const getInvoice = async (req, res) => {
    try {
      const orderId = req.query.id; 
     
    
  
      const order = await Orders.findById(orderId);
      if (!order) {
        return res.status(404).send({ message: 'Order not found' });
      }
  
      const { userId, address: addressId } = order;
      
      const [user, address] = await Promise.all([
        User.findById(userId),
        Address.findById(addressId),
      ]);
  
  
      const products = order.product.map((product) => ({
        quantity: product.quantity.toString(),
        description: product.name,
        tax: product.tax,
        price: product.price,
      }));
      console.log(products)
  
      const date = moment(order.date).format('MMMM D, YYYY');
      
      
  
  
      if (!user || !address) {
        return res.status(404).send({ message: 'User or address not found' });
      }
  
      const filename = `invoice_${orderId}.pdf`;
  
      const data = {
        mode: "development",
        currency: 'USD',
        taxNotation: 'vat',
        marginTop: 25,
        marginRight: 25,
        marginLeft: 25,
        marginBottom: 25,
        background: 'https://public.easyinvoice.cloud/img/watermark-draft.jpg',
        sender: {
          company: 'SHOPIFY',
          address: 'Canyon',
          zip: '600091',
          city: 'Chennai',
          country: 'India',
        },
        client: {
          company: user.name,
          address: address.adressLine1,
          zip: address.pin,
          city: address.city,
          country: 'India',
        },
  
        information: {
          // Invoice number
          number: "2021.0001",
          // Invoice data
          date: date,
          // Invoice due date
          // duedate: "31-12-2021"
      },
    
        // invoiceNumber: '2023001',
        // invoiceDate: date,
  
  
        products: products
       
      };
  
      console.log(data)
  
  easyinvoice.createInvoice(data, function (result) {
  
    easyinvoice.createInvoice(data, function (result) {
      const fileName = 'invoice.pdf'
      const pdfBuffer = Buffer.from(result.pdf, 'base64');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
      res.send(pdfBuffer);
    })
    console.log('PDF base64 string: ');
  });
  } 
     
     catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");
    }
  };







module.exports = {
    myOrders,
    orderDetails,
    orderSuccess,
    
    getInvoice,
    cancelOrder, cancelOneProduct,
    returnOrder,
    returnOneProduct,
    filterOrders,
}