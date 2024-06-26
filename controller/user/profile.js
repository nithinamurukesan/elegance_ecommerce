const Address = require('../../model/address')
const User    = require('../../model/userModel')




   
 /// Load Profile/////

 const loadProfile = async(req, res) => {
    try { 
    const user=req.session.user
    const id = user._id    
    const userData = await User.findById(id).lean();
    // const userDataObject = userData.toObject();
    res.render('user/about_me', {userData})
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}


/// To get manage address page ///


 const manageAddress = async(req, res) => {
    try {
        const userData = req.session.user
        const id       = userData._id
        
        const userAddress = await Address.find({userId : id}).lean()
        res.render('user/manage_address', {userAddress, userData})
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}


//// To add new address  ////


const addNewAddress = (req, res) => {
    try {
        res.render('user/add_new_address')
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}


//// To add new address ////


const addNewAddressPost = async(req, res) => {
    try {
        const userData = req.session.user
        const id       = userData._id
        
        const adress = new Address({
            userId      : id,
            name        : req.body.name,
            mobile      : req.body.mobile,
            adressLine1 : req.body.address1,
            adressLine2 : req.body.address2,
            city        : req.body.city,
            state       : req.body.state, 
            pin         : req.body.pin, 
            is_default  : false,
        })

        const adressData = await adress.save()
        res.redirect('/adresses')
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}


const editAddress = async (req, res) => {
    try {

        const id = req.params.id

        const address = await Address.findById(id);
        const addressObject = address.toObject();

        res.render('user/editAddress',{ address:addressObject })
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}


const editAddressPost = async (req, res) => {
    try {

        const id = req.params.id

        await Address.findByIdAndUpdate(id, {$set:{
            name        : req.body.name,
            mobile      : req.body.mobile,
            adressLine1 : req.body.address1,
            adressLine2 : req.body.address2,
            city        : req.body.city,
            state       : req.body.state, 
            pin         : req.body.pin, 
            is_default  : false,
        }}, {new : true})

        res.redirect('/adresses')
        
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}


///// Edit user details  //////


const editDetails = (req, res) => {

    try {
        const userData = req.session.user
        res.render('user/edit_user', {userData})
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
}


/// Update edited user details  ////


const updateDetails = async (req, res) => {
    try {
        const id = req.params.id

        await User.findByIdAndUpdate(id, {$set:{
            name   : req.body.name,
            mobile : req.body.mobile,
            email  : req.body.email,
        }}, {new : true})

        res.redirect('/profile')
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }   
 }


///// To delete addresss  ////

 const deleteAddress = async(req, res) => {
    try {
        const id = req.params.id

        await Address.findByIdAndDelete(id)
        res.redirect('/adresses')
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");    }
 }

 module.exports = {
    loadProfile,
    manageAddress,
    addNewAddress,
    addNewAddressPost,
    editAddress,
    editAddressPost,
    editDetails,
    updateDetails,
    deleteAddress





 }

 
