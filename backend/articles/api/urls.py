from django.urls import path

from articles.api.views import detail as detail
from articles.api.views import listing as listing
from articles.api.views import admin_articles
from articles.api.views import admin_categories
from articles.api.views import admin_tags

app_name = 'articles_api'

urlpatterns = [
    # Article API (public)
    path('listing/',
        listing.ArticleListView.as_view(), name='article_listing_api'),
    path('featured/',
        listing.ArticleFeaturedListView.as_view(), name='article_featured_api'),
     path('featured-cards/',
          listing.ArticleFeaturedPreviewListView.as_view(), name='article_featured_cards_api'),
    path('category/',
        listing.ArticleCategoryListView.as_view(), name='article_category_api'),
    path('tag/',
        listing.ArticleTagListView.as_view(), name='article_tag_api'),
    path('author/',
        listing.ArticleAuthorListView.as_view(), name='article_author_api'),
    path('detail/',
        detail.ArticleDetailView.as_view(), name='article_detail_api'),
    path('category-list/',
        listing.ArticleCategoryListViewAll.as_view(), name='article_category_list_api'),
    path('tag-list/',
        listing.ArticleTagListViewAll.as_view(), name='article_tag_list_api'),

    # Admin Article CRUD
    path('admin-articles/', admin_articles.admin_article_list,
         name='admin_article_list_api'),
    path('admin-articles/options/', admin_articles.admin_article_options,
         name='admin_article_options_api'),
    path('admin-articles/<int:pk>/', admin_articles.admin_article_detail,
         name='admin_article_detail_api'),
    path('admin-articles/create/', admin_articles.admin_article_create,
         name='admin_article_create_api'),
    path('admin-articles/<int:pk>/update/', admin_articles.admin_article_update,
         name='admin_article_update_api'),
    path('admin-articles/<int:pk>/delete/', admin_articles.admin_article_delete,
         name='admin_article_delete_api'),

    # Admin Article Category CRUD
    path('admin-article-categories/', admin_categories.admin_article_category_list,
         name='admin_article_category_list_api'),
    path('admin-article-categories/create/', admin_categories.admin_article_category_create,
         name='admin_article_category_create_api'),
    path('admin-article-categories/<int:pk>/update/', admin_categories.admin_article_category_update,
         name='admin_article_category_update_api'),
    path('admin-article-categories/<int:pk>/delete/', admin_categories.admin_article_category_delete,
         name='admin_article_category_delete_api'),

    # Admin Article Tag CRUD
    path('admin-article-tags/', admin_tags.admin_article_tag_list,
         name='admin_article_tag_list_api'),
    path('admin-article-tags/<int:pk>/', admin_tags.admin_article_tag_detail,
         name='admin_article_tag_detail_api'),
    path('admin-article-tags/create/', admin_tags.admin_article_tag_create,
         name='admin_article_tag_create_api'),
    path('admin-article-tags/<int:pk>/update/', admin_tags.admin_article_tag_update,
         name='admin_article_tag_update_api'),
    path('admin-article-tags/<int:pk>/delete/', admin_tags.admin_article_tag_delete,
         name='admin_article_tag_delete_api'),
]
