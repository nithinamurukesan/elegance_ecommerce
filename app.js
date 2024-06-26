const createError = require('http-errors');
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose')
const hbs = require('hbs')
const session = require('express-session')
const Handlebars = require('handlebars')
const exphbs = require('express-handlebars')
const nocache = require('nocache')
const multer = require('multer')
const swal=require('sweetalert')
const moment=require('moment')
 require('dotenv').config()

 mongoose.set('strictQuery', false);
 mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })
 .then(() => {
   console.log('MongoDB connected');
 })
 .catch(err => {
   console.error('MongoDB connection error:', err);
 });

const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
// const { handlebars } = require('hbs');

const app = express();


let hbss = exphbs.create({})


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.engine('hbs', handlebars.engine({
  layoutsDir: __dirname + '/views/layouts',
  extname: 'hbs',
  defaultLayout: 'layout',
  partialsDir: __dirname + '/views/partials/'
}));


hbs.registerPartials(path.join(__dirname,'/views/partials'))


Handlebars.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});


Handlebars.registerHelper('ifnoteq', function (a, b, options) {
  if (a != b) { return options.fn(this); }
  return options.inverse(this);
});

Handlebars.registerHelper('add', function (a, b) {
  return a+b
});

Handlebars.registerHelper('sub', function (a, b) {
  return a-b
});


Handlebars.registerHelper("for", function (from, to, incr, block) {
  let accum = "";
  for (let i = from; i <= to; i += incr) {
    accum += block.fn(i);
  }
  return accum;

})


Handlebars.registerHelper('ifCond', function(v1, v2, options) {
  if (v1 === v2) {
    return options.fn ? options.fn(this) : options.fn;
  } else {
    return options.inverse ? options.inverse(this) : options.inverse
  }
})

Handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

// Handlebars.registerHelper('multiply', function (a, b) {
//   return a * b;
// });

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});


Handlebars.registerHelper('ifeq', function (a, b, options) {
  if (a == b) { return options.fn(this); }
  return options.inverse(this);
});


  Handlebars.registerHelper('statuchecker',  function (value) {
      let count1=0
      let count2=0
      let returnct= value.product.forEach((elem)=>{
          if(elem.isReturned)count1++
      })
      let returnct2= value.product.forEach((elem)=>{
          if(elem.isCancelled)count2++
      })

      let allCancelled = value.product.every(product => product.isCancelled);
      let allReturned = value.product.every(product => product.isReturned);
      
  
      if (value.status === "Delivered") {
          return new Handlebars.SafeString(`
              <button id="returnOrder" data-order-id="${value._id}" class="btn btn-sm btn-primary">Return Entire Order</button>
          `);
      } else if (value.status == "Returned") {
          return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Order Returned</span>');
      } else {
          if (allCancelled || value.status === 'Cancelled') {
              return new Handlebars.SafeString('<span class="badge rounded-pill alert-danger text-danger">Order Cancelled</span>');
          } else if (count1>0 ) {
              return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Order Returned</span>');
          } else {
              return new Handlebars.SafeString(`
                  <button id="cancelOrder" data-order-id="${value._id}" class="btn btn-sm btn-primary">Cancel Entire Order</button>
              `);
          }
      }
  });

  Handlebars.registerHelper('singlestatuchecker', function (product, options) {
    if (product.isReturned) {
        return new Handlebars.SafeString('<span class="badge rounded-pill alert-info text-info">Returned</span>');
    } else if (product.isCancelled) {
        return new Handlebars.SafeString('<span class="badge rounded-pill alert-danger text-danger">Cancelled</span>');
    } else {
        return options.fn(this);
    }
});

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
      case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
          return options.inverse(this);
  }
});


Handlebars.registerHelper('formatDate', function (isoDate) {
  const monthYear = moment(isoDate).format('DD-MM-YYYY HH:mm:ss');


  return `${monthYear}`;
});

Handlebars.registerHelper('increment', function(index) {
  return index + 1;
});

// hbs.registerHelper("json", function (context) {
//   return JSON.stringify(context)
// })


app.use(session({
  secret: process.env.SECRETKEY,
  saveUninitialized: true,
   cookie: { maxAge: 600000000 },
  resave: false 
}));


app.use(nocache());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// app.use(multer({dest: 'uploads', storage: fileStorage, fileFilter: fileFilter}).single('image'))

app.use('/admin', adminRouter);
app.use('/', userRouter);

// catch 404 and forward to error handler

app.use(function(req, res, next) {
  res.status(404).render('404',{layout:'404layout'});
});


// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });



// Catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

app.use(function(req, res, next) {
  res.status(404).render('404',{ layout:'404layout' });
});

// Error handler middleware
app.use((err, req, res, next) => {
  
   res.locals.message = err.message;
   res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  if (err.status === 404) {
      res.render('404', { layout: '404layout' });
  } else {
      res.render('error'); 
  }
});
 

app.listen(process.env.PORT)
