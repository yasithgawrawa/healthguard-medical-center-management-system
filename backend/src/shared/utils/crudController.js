// Shared CRUD Operations | Shared Logic | Provide shared crud controller behavior for the application.
import { successResponse } from "./apiResponse.js";
import { AppError } from "./AppError.js";

// Shared CRUD Operations | Shared Logic | Build reusable create, list, detail, update, and delete handlers for a Mongoose model.
export const createCrudController = (Model, resourceName, options = {}) => ({
  // Shared CRUD Operations | Shared Logic | Apply the optional creation hook and save a new model record.
  create: async (req, res) => {
    const payload = options.beforeCreate ? await options.beforeCreate(req.body, req) : req.body;
    const record = await Model.create(payload);
    return successResponse(res, `${resourceName} created successfully`, record, 201);
  },
  // Shared CRUD Operations | Shared Logic | Apply the optional request filter and return the newest model records first.
  list: async (req, res) => {
    const filter = options.listFilter ? await options.listFilter(req) : {};
    const records = await Model.find(filter).sort({ createdAt: -1 });
    return successResponse(res, `${resourceName} list loaded`, records);
  },
  // Shared CRUD Operations | Shared Logic | Load a record by route ID or return a 404 error.
  get: async (req, res) => {
    const record = await Model.findById(req.params.id);
    if (!record) throw new AppError(`${resourceName} not found`, 404);
    return successResponse(res, `${resourceName} loaded`, record);
  },
  // Shared CRUD Operations | Shared Logic | Apply the optional update hook and save changes with model validation.
  update: async (req, res) => {
    const payload = options.beforeUpdate ? await options.beforeUpdate(req.body, req) : req.body;
    const record = await Model.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!record) throw new AppError(`${resourceName} not found`, 404);
    return successResponse(res, `${resourceName} updated successfully`, record);
  },
  // Shared CRUD Operations | Shared Logic | Apply configured soft deletion or physically delete the model record.
  remove: async (req, res) => {
    const record = options.softDelete
      ? await Model.findByIdAndUpdate(req.params.id, options.softDelete, { new: true })
      : await Model.findByIdAndDelete(req.params.id);
    if (!record) throw new AppError(`${resourceName} not found`, 404);
    return successResponse(res, `${resourceName} removed successfully`, record);
  }
});
