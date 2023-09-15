const Organisation = require('../models/organisationModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const factory = require('./handlerFactory')

const Team = require('../models/team.model')
const Session = require('../models/session.model')

const filterObj = (obj,...allowedFields) => {
    console.log(obj);
    const newObj = {};
    Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });    
    return newObj;
  };
  
exports.getMe = (req, res, next) => {
    req.params.id = req.body.id;
    console.log("Oh Ho!!!")
    next();
};

  
exports.createOrganisation = catchAsync(async(req, res) => {
    const {email} = await req.body;
    const org = await Organisation.findOne({"contact.email" : email});
    if(!org) 
    {
        const newOrg = Organisation.create(req.body);
        createSendToken(newOrg, 201, res);
    }
    else throw new Error("Organisation Already exists");
})

exports.updateOrganisation = catchAsync(async(req, res, next) => {

    //If Change Password is attempted
    if (req.body.password || req.body.passwordConfirm) {
        return new AppError(
            "This route is not for password update , use /updateMyPassword for that ",
            400
          )
        
      }

    //values not supposed to be updated
    const filteredBody = filterObj(req.body, "name", "Id", "employees");
    console.log("filter", filteredBody, "HI", req.body, req.body.resources)    
    const updatedOrganisation = await Organisation.findByIdAndUpdate(req.body._id, req.body, {
        new: true,
        runValidators: true,
      });
    
    res.status(200).json({
        status: "success",
        data: {
            organisation : updatedOrganisation,
        }
    })
})

exports.getOrganisation = factory.getOne(Organisation);

exports.getAllOrganisationBySession = catchAsync(async(req, res) => {
  const {_id, sessionId} = req.body
  const session = Session.findOne({_id : _id})
  
  res.status(200).json({
    status: "success",
    data: {
        organisations : session.organisations,
    }
})
})

exports.getAllOrganisation = catchAsync(async(req, res) => {
    const {_id, type} = req.body
    const {location} = await Organisation.findOne({_id : _id})
    //Have to check
    const Organisations = await Organisation.find({type : type}).aggregate([
        {
                $project: {
                  name: 1, // Include other fields you need
                  type: 1,
                  location: 1,
                  distance: {
                    $sqrt: {
                      $sum: [
                        { $pow: [{ $subtract: ['$location.long', location.long] }, 2] },
                        { $pow: [{ $subtract: ['$location.lat', location.lat] }, 2] },
                      ],
                    },
                  },
                },
              },
              {
                $match: {
                  type: type,
                },
              },
          {
            $sort: {
              distance: -1, // Sort by distance in descending order
            },
          },
    ])
    res.status(200).json({
        status: "success",
        data: {
            organisations : Organisations,
        }
    })
})

exports.getAllRequests = catchAsync(async (req, res) => {
  const { orgId } = req.params;

  // Find the organization based on orgId and populate the requests array
  const organization = await Organisation.findById(orgId).populate('requests');

  if (!organization) {
    return next(new AppError('Organization not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      requests: organization.requests,
    },
  });
});


exports.AcceptReqFromOff = catchAsync(async(req, res) => {
    const {request} = req.body
    const org = await Organisation.findOneAndUpdate({_id : OrgId, "notifications.at" : request.at}, {$set : {'notifications.$.status' : true}})
    const session = await Session.create({notifications : [request]})
    res.status(200).json({
        status: "success",
        data: {
            session : session,
        }
    })
})

exports.deleteOrganisation = factory.deleteOne(Organisation);