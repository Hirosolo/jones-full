from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Brand, Category, Tag, Product, Review, ProductImage, ProductVariant, ProductColor, ProductSize
from .forms import (
	ProductAdminForm,
	ProductBrandAdminForm,
	ProductCategoryAdminForm,
	ProductTagAdminForm,
	ProductReviewAdminForm,
)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
	list_display = ('name', 'slug')
	prepopulated_fields = {'slug': ('name',)}
	form = ProductBrandAdminForm


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ('name', 'slug')
	prepopulated_fields = {'slug': ('name',)}
	form = ProductCategoryAdminForm


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
	list_display = ('name', 'slug')
	prepopulated_fields = {'slug': ('name',)}
	form = ProductTagAdminForm


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
	list_display = ('product', 'order', 'removed')
	raw_id_fields = ('product',)


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
	list_display = ('product', 'code', 'price_origin', 'price_promo')
	raw_id_fields = ('product',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
	list_display = ('name', 'code', 'slug', 'price', 'category', 'brand', 'is_available', 'edit_link')
	search_fields = ('name', 'code', 'slug')
	readonly_fields = ('code', 'created_at', 'updated_at')
	form = ProductAdminForm
	raw_id_fields = ('brand', 'category')

	class ProductImageInline(admin.TabularInline):
		model = ProductImage
		extra = 0
		fields = ('img', 'alt', 'order', 'removed')
		readonly_fields = ()

	class ProductVariantInline(admin.TabularInline):
		model = ProductVariant
		extra = 0
		fields = ('color', 'size', 'code', 'price_origin', 'price_promo')
		readonly_fields = ('code',)
		show_change_link = True

	inlines = [ProductImageInline, ProductVariantInline]

	@admin.display(description='Edit')
	def edit_link(self, obj):
		if not obj or not obj.pk:
			return '-'
		url = reverse('admin:myshop_product_change', args=[obj.pk])
		return format_html('<a class="button" href="{}">Edit</a>', url)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
	list_display = ('product', 'rating', 'subject', 'created_at', 'status')
	raw_id_fields = ('product',)
	form = ProductReviewAdminForm
