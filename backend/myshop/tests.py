from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from .models import Product, Brand, Category


class AdminProductAccessTests(TestCase):
	def setUp(self):
		User = get_user_model()
		# Create staff user
		self.user = User.objects.create_user(username='admin', email='admin@example.com', password='pass')
		self.user.is_staff = True
		self.user.is_superuser = True
		self.user.save()

		# Minimal related objects
		self.brand = Brand.objects.create(name='TBrand')
		self.category = Category.objects.create(name='TCat')

		# Create a product
		self.product = Product.objects.create(
			name='Test Product',
			price_origin=10.0 if hasattr(Product, 'price_origin') else None,
			price=9.99 if hasattr(Product, 'price') else 9.99,
			category=self.category,
			brand=self.brand
		)

		self.client = Client()

	def test_admin_product_changelist_and_change_page(self):
		# Login as staff
		logged = self.client.login(username='admin', password='pass')
		self.assertTrue(logged)

		# Access changelist
		list_url = '/admin/myshop/product/'
		resp = self.client.get(list_url)
		self.assertEqual(resp.status_code, 200)

		# Access change page for product
		change_url = f'/admin/myshop/product/{self.product.id}/change/'
		resp2 = self.client.get(change_url)
		self.assertEqual(resp2.status_code, 200)
