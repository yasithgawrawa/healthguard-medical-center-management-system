import { successResponse } from "./apiResponse.js";
import { AppError } from "./AppError.js";

export const createCrudController = (Model, resourceName, options = {}) => ({
  create: async (req, res) => {
    const payload = options.beforeCreate ? await options.beforeCreate(req.body, req) : req.body;
    const record = await Model.create(payload);
    return successResponse(res, `${resourceName} created successfully`, record, 201);
  },
  list: async (req, res) => {
    const filter = options.listFilter ? await options.listFilter(req) : {};
    const records = await Model.find(filter).sort({ createdAt: -1 });
    return successResponse(res, `${resourceName} list loaded`, records);
  },
  get: async (req, res) => {
    const record = await Model.findById(req.params.id);
    if (!record) throw new AppError(`${resourceName} not found`, 404);
    return successResponse(res, `${resourceName} loaded`, record);
  },
  update: async (req, res) => {
    const payload = options.beforeUpdate ? await options.beforeUpdate(req.body, req) : req.body;
    const record = await Model.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!record) throw new AppError(`${resourceName} not found`, 404);
    return successResponse(res, `${resourceName} updated successfully`, record);
  },
  remove: async (req, res) => {
    const record = options.softDelete
      ? await Model.findByIdAndUpdate(req.params.id, options.softDelete, { new: true })
      : await Model.findByIdAndDelete(req.params.id);
    if (!record) throw new AppError(`${resourceName} not found`, 404);
    return successResponse(res, `${resourceName} removed successfully`, record);
  }
});
