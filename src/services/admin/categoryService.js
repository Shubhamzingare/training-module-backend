const Category = require('../../models/Category');
const { NotFoundError, ValidationError } = require('../../utils/errors');

class CategoryService {
  static async createCategory(data, userId) {
    const { name, description, icon } = data;

    if (!name) {
      throw new ValidationError('Category name is required');
    }

    const category = new Category({
      name,
      description: description || '',
      icon: icon || '📚',
      createdBy: userId,
    });

    await category.save();
    return category;
  }

  static async getAllCategories() {
    const categories = await Category.find().populate('createdBy', 'name email');
    return categories;
  }

  static async getCategoryById(categoryId) {
    const category = await Category.findById(categoryId).populate('createdBy', 'name email');
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  static async updateCategory(categoryId, data) {
    const { name, description, icon } = data;

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, description, icon },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  static async deleteCategory(categoryId) {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }
}

module.exports = CategoryService;
