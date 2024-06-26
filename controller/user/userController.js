const User = require('../../model/userModel')
const argon2 = require('argon2')
const userHelper = require('../../helpers/user.helper')
const Product = require('../../model/productModel')
const Category = require('../../model/categoryModel')

const Review = require('../../model/reviewModel')
const Order = require('../../model/order')
const { log } = require('handlebars')

const mongoose = require('mongoose')

let otp
let userOtp
let hashedPassword
let userRegData
let otpError = ''
let isLogedin = false
let userData
let userEmail
let productSearched = false
let message2


//To load home

const loadHome = async (req, res) => {

    try {
        const loadProData = await Product.find().populate('category', 'isListed').lean()
        // const prod=  loadProData.filter(elem=>elem.category.isListed)
        // console.log(prod)

        const loadCatData = await Category.find({ isListed: true }).lean()

        const userData = req.session.user


        res.render('user/home', { userData, loadProData, loadCatData, })

    } catch (error) {
        console.log(error);
    }
}

//user login page


const userLogin = (req, res) => {

    let regSuccessMsg = 'User registered sucessfully..!!'
    let blockMsg = 'Sorry something went wrong..!!'
    let mailErr = 'Incorrect email or password..!!'
    let newpasMsg = 'Your password reseted successfuly..!!'
    message2 = false


    if (req.session.mailErr) {
        res.render('user/login', { mailErr })
        req.session.mailErr = false
    }
    else if (req.session.regSuccessMsg) {
        res.render('user/login', { regSuccessMsg })
        req.session.regSuccessMsg = false
    }
    else if (req.session.userBlocked) {
        res.render('user/login', { blockMsg })
        req.session.userBlocked = false
    }
    else if (req.session.LoggedIn) {
        res.render('user/login')
        req.session.LoggedIn = false
    }
    else if (req.session.newPas) {
        res.render('user/login', { newpasMsg })
        req.session.newPas = false
    }
    else {
        res.render('user/login')
    }
}


//user signup page

const usersignup = (req, res) => {
    try {
        res.render('user/signup')
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");
    }
}

//google authentication

const googleCallback = async (req, res) => {
    try {
        // Add the user's name to the database
        userData = await User.findOneAndUpdate(
            { email: req.user.email },
            { $set: { name: req.user.displayName, isVerified: true, isBlocked: false } },
            { upsert: true, new: true }
        );

        // Set the user session
        req.session.LoggedIn = true
        req.session.user = userData
        // Redirect to the homepage
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
}

//To get otp page

const getOtp = (req, res) => {
    try {
        res.render('user/submitOtp')
    } catch (error) {
        console.log(error);
    }
}



//Submit otp and save user

const submitOtp = async (req, res) => {
    try {
        userOtp = req.body.otp;


        if (userOtp == otp) {
            const user = new User({
                name: userRegData.name,
                email: userRegData.email,
                mobile: userRegData.phone,
                password: hashedPassword,
                isVerified: true,
                isBlocked: false,
            });

            await user.save();

            req.session.regSuccessMsg = true;

            // Send JSON response with success message
            res.json({ success: true, redirectUrl: '/login' });
        } else {
            otpError = 'incorrect otp';

            // Send JSON response with error message
            res.json({ error: otpError });
        }
    } catch (error) {
        console.log(error);

        // Send JSON response with error message
        res.json({ error: 'An error occurred while submitting the OTP.' });
    }
};

//To resend otp

const resendOtp = async (req, res) => {
    try {
        res.redirect('/get_otp')
        otp = await userHelper.verifyEmail(userEmail)
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");
    }
}


//User login


const doLogin = async (req, res) => {

    try {
        let email = req.body.email
        let password = req.body.password

        userData = await User.findOne({ email: email });
        console.log(email)
        console.log(password)

        if (userData) {
            if (await argon2.verify(userData.password, password)) {

                const isBlocked = userData.isBlocked

                if (!isBlocked) {

                    req.session.LoggedIn = true
                    req.session.user = userData

                    res.redirect('/')
                } else {
                    userData = null
                    req.session.userBlocked = true
                    res.redirect('/login')
                }
            }
            else {
                req.session.mailErr = true
                res.redirect('/login')
            }
        } else {
            req.session.mailErr = true
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");
    }
}

//User logout


const doLogout = async (req, res) => {
    try {
        req.session.destroy()
        userData = null
        // req.session.LoggedIn = false
        res.redirect('/login')

    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");
    }
}



//user signup

const doSignup = async (req, res) => {

    try {
        hashedPassword = await userHelper.hashPassword(req.body.password)
        userEmail = req.body.email
        userRegData = req.body


        const userExist = await User.findOne({ email: userEmail })
        if (!userExist) {
            otp = await userHelper.verifyEmail(userEmail)
            res.render('user/submitOtp')
        }
        else {
            message2 = true

            res.render('user/login', { message2 })

        }

    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");
    }
}

//shop page
const getProduct = async (req, res) => {
    const user = req.session.user;



    try {
        let page = 1; // Initial page is always 1 for the GET request
        const limit = 6;
        const loadCatData = await Category.find().lean();
        const newproducts = await Product.find({ is_blocked: false }).sort({ _id: -1 }).limit(3).lean()
        const proData = await Product.find({ is_blocked: false })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('category', 'category')
            .lean();
        const count = await Product.countDocuments({ is_blocked: false });
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        res.render('user/products', {
            proData,
            pages,
            currentPage: page,
            userData: user,
            loadCatData,
            currentFunction: 'getProductsPage',
            newproducts,
            count
            // layout:'productLayout'

        });
    } catch (error) {
        console.log(error);
    }
};



const getProductsPage = async (req, res) => {
    const user = req.session.user;

    try {
        const page = parseInt(req.body.page); // Get the page number from the POST request
        const limit = 6;
        const proData = await Product.find({ is_blocked: false })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('category', 'category')
            .lean();
        const count = await Product.countDocuments({ is_blocked: false });
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        res.json({
            proData,
            pages,
            currentPage: page,
            currentFunction: 'getProductsPage'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// individual product view

const ProductView = async (req, res) => {
    try {
        const proId = req.query.id
        const proData = await Product.findById(proId).lean()
        const userData = req.session.user

        await Product.updateOne(
            {
                _id: proId
            },
            {
                $inc: {
                    popularity: 1
                }
            }
        )

        const reviews = await Review.find({ productId: proId }).lean()

        let reviewExist = true
        if (reviews.length == 0) {
            reviewExist = false
        }
        let userCanReview = false;




        if (userData) {
            const userId = userData._id
            let productExistInCart

            const ObjectId = mongoose.Types.ObjectId;

            // query
            const productExist = await User.find({ _id: userId, "cart.product": new ObjectId(proId) }).lean();

            if (productExist.length === 0) productExistInCart = false
            else productExistInCart = true



            const Orders = await Order.find({ userId: userId, status: "Delivered" }, { product: 1, _id: 0 })
            for (let i of Orders) {

                for (let j of i.product) {
                    if (j.name == proData.name) {
                        userCanReview = true
                    }
                }
            }

            res.render('user/productview', { proData, userData, productExistInCart, reviews, reviewExist, userCanReview })
        } else {
            res.render('user/productview', { proData, reviews, reviewExist })
        }
    } catch (error) {
        console.log(error);
    }
}

//product search

const productSearch = async (req, res) => {
    const { search, catId } = req.body


    if (catId) {

        try {
            const products = await Product.find({ category: catId, name: { $regex: search, $options: 'i' } });
            res.json(products);
        } catch (error) {
            console.log(error);
            console.log(error.message);
            res.status(500).send(" Error");
        }


    } else {
        try {
            const products = await Product.find({ name: { $regex: search, $options: 'i' } });
            console.log(products);

            res.json(products);
        } catch (error) {
            console.log(error.message);
            res.status(500).send(" Error");
        }

    }
}


const sortProductByName = async (req, res) => {
    try {
        const { sort, catId, page } = req.body;
        const limit = 6;
        const skip = (page - 1) * limit;

        let query = { is_blocked: false };
        if (catId) {
            query.category = catId;
        }

        const sortOrder = sort === 'asc' ? 1 : -1;

        const products = await Product.find(query)
            .sort({ name: sortOrder })
            .populate('category', 'category')
            .skip(skip)
            .limit(limit)
            .lean();

        const count = await Product.countDocuments(query);
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        res.json({ productData: products, pages, currentPage: page, sort });
    } catch (error) {
        console.log(error.message);
        res.status(500).send(" Error");
    }
};


const sortProductByPrice = async (req, res) => {
    try {
        const { sort, catId, page } = req.body;
        const limit = 6;
        const skip = (page - 1) * limit;

        let query = { is_blocked: false };
        if (catId) {
            query.category = catId;
        }

        const products = await Product.find(query)
            .sort({ price: sort })
            .populate('category', 'category')
            .skip(skip)
            .limit(limit)
            .lean();

        const count = await Product.countDocuments(query);
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        res.json({ productData: products, pages, currentPage: page, sort });
    } catch (error) {
        console.log(error);
        console.log(error.message);
        res.status(500).send(" Error");
    }
};


const aboutpage = (req, res) => {
    const userData = req.session.user
    try {
        res.render('user/about', { userData })
    } catch (error) {
        console.log(error);
    }
}

const contactpage = (req, res) => {
    const userData = req.session.user
    try {
        res.render('user/contact', { userData })
    } catch (error) {
        console.log(error);
    }
}

const addNewReviewPost = async (req, res) => {
    try {
        const userData = req.session.user
        const id = userData._id

        const review = new Review({
            userId: id,
            productId: req.body.proId,
            name: req.body.name,
            // rating      : req.body.rating,
            comment: req.body.comment,
            email: req.body.email,
            // date        : Date.now, 
            is_default: false,
        })

        const reviewData = await review.save()
        res.redirect(`/productview?id=${req.body.proId}`)

    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    doLogout,
    getProduct,
    getProductsPage,
    loadHome,
    ProductView,
    userLogin,
    usersignup,
    doSignup,
    submitOtp,
    doLogin,
    getOtp,
    resendOtp,
    productSearch,
    sortProductByName,
    sortProductByPrice,
    googleCallback,
    aboutpage,
    contactpage,
    addNewReviewPost

}