import { useEffect, useState, useRef } from "react";
import AdminLayout from "src/components/layouts/AdminLayout";
import Form from "src/components/common/Form";
import TextField from "src/components/formControls/TextField";
import Dropdown from "src/components/formControls/Dropdown";
import Button from "src/components/formControls/Button";
import AutoComplete from "src/components/formControls/AutoComplete";
import type { beforeSubmitType } from "src/components/common/Form";

const mockCategories = ["Apparel", "Accessories", "Home", "Electronics"];
const mockBrands = ["Acme", "Contoso", "Globex"];
const mockTags = ["summer", "sale", "limited"];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/-+/g, "-");
}

export default function CreateProductPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("Draft");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(mockTags);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // auto-generate slug unless manually edited
  useEffect(() => {
    if (!slugManual) setSlug(slugify(name || ""));
  }, [name, slugManual]);

  const addImageRow = () => setImages((s) => [...s, ""]);
  const updateImage = (idx: number, url: string) =>
    setImages((s) => s.map((v, i) => (i === idx ? url : v)));
  const removeImage = (idx: number) =>
    setImages((s) => s.filter((_, i) => i !== idx));

  const toggleTag = (tag: string) => {
    setSelectedTags((s) => (s.includes(tag) ? s.filter((t) => t !== tag) : [...s, tag]));
  };

  const createNewTag = async () => {
    const name = prompt("New tag name");
    if (!name) return;
    setTags((s) => [name, ...s]);
    setSelectedTags((s) => [name, ...s]);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Product Name is required";
    if (!price || Number(price) <= 0) e.price = "Price must be positive";
    if (!category) e.category = "Category is required";
    if (!brand) e.brand = "Brand is required";
    images.forEach((u, i) => {
      if (u) {
        try {
          // will throw if invalid
          new URL(u);
        } catch (err) {
          e[`image_${i}`] = "Image URL is invalid";
        }
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const beforeSubmit: beforeSubmitType = async (params) => {
    if (!validate()) return [params, false];
    // attach images, tags, flags
    params.title = name;
    params.slug = slug;
    params.price = price;
    params.compareAt = compareAt;
    params.category = category;
    params.brand = brand;
    params.status = status;
    params.shortDescription = shortDesc;
    params.fullDescription = fullDesc;
    params.mediaURLs = images.filter(Boolean).join("\n");
    params.tags = selectedTags.join(",");
    params.featured = featured;
    params.bestSeller = bestSeller;
    params.metaTitle = metaTitle;
    params.metaDescription = metaDesc;

    // NOTE: Slug uniqueness should be validated server-side. Client may optionally call an API.

    return [params, true];
  };

  return (
    <AdminLayout>
      <div className="admin__section admin__dark">
        <div className="form-card">
          <header className="form-card__header">
            <h2>➕ Create Product</h2>
            <div>
              <a className="btn btn-secondary" href="/admin/products">← Back to List</a>
            </div>
          </header>
          <Form method="POST" action="/api/admin/products" beforeSubmit={beforeSubmit}>
            <div className="form-grid">
              <div className="col-2">
                <TextField
                  name="title"
                  label="Product Name *"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                />
              </div>
              <div className="col-2">
                <TextField
                  name="slug"
                  label="URL Slug"
                  placeholder="auto-generated-from-name"
                  value={slug}
                  onChange={(e: any) => {
                    setSlug(e.target.value);
                    setSlugManual(true);
                  }}
                />
                <div className="slug-preview">Preview: /p/{slug || "product-slug"}</div>
              </div>
            </div>

            <div className="form-grid two-cols">
              <div>
                <TextField
                  name="price"
                  label="Price *"
                  type="number"
                  value={price}
                  onChange={(e: any) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <TextField
                  name="compareAt"
                  label="Compare-at Price (strikethrough)"
                  type="number"
                  value={compareAt}
                  onChange={(e: any) => setCompareAt(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid three-cols">
              <div>
                <label>Category *</label>
                <div className="inline-actions">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select...</option>
                    {mockCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="small" onClick={() => alert("Open create category flow")}>+ New</button>
                </div>
                {errors.category && <div className="error">{errors.category}</div>}
              </div>
              <div>
                <label>Brand *</label>
                <div className="inline-actions">
                  <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                    <option value="">Select...</option>
                    {mockBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="small" onClick={() => alert("Open create brand flow")}>+ New</button>
                </div>
                {errors.brand && <div className="error">{errors.brand}</div>}
              </div>
              <div>
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label>Short Description</label>
              <textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
            </div>

            <div>
              <label>Full Description (HTML)</label>
              <textarea value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} rows={8} />
            </div>

            <section>
              <h4>Product Images</h4>
              <p className="helper">First image is primary, drag order respected</p>
              <div className="image-list">
                {images.map((url, i) => (
                  <div className="image-row" key={i}>
                    <div className="thumb">
                      {url ? <img src={url} alt="thumb" /> : <div className="placeholder">No image</div>}
                    </div>
                    <input placeholder="https://example.com/primary.jpg" value={url} onChange={(e) => updateImage(i, e.target.value)} />
                    <button type="button" className="small" onClick={() => removeImage(i)}>
                      Remove
                    </button>
                    {errors[`image_${i}`] && <div className="error">{errors[`image_${i}`]}</div>}
                  </div>
                ))}
                <div>
                  <button type="button" onClick={addImageRow} className="btn btn-link">
                    + Add image URL
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h4>
                Tags (click to toggle — {selectedTags.length} selected)
                <button type="button" className="small right" onClick={createNewTag}>
                  + New Tag
                </button>
              </h4>
              <div className="tags-container">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={selectedTags.includes(t) ? "tag selected" : "tag"}
                    onClick={() => toggleTag(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            <section className="flags">
              <label>
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> ⭐ Featured Product
              </label>
              <label>
                <input type="checkbox" checked={bestSeller} onChange={(e) => setBestSeller(e.target.checked)} /> 🏆 Best Seller
              </label>
            </section>

            <section className="seo two-cols">
              <div>
                <label>Meta Title (SEO)</label>
                <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} />
              </div>
              <div>
                <label>Meta Description (SEO)</label>
                <input value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />
              </div>
            </section>

            <footer className="form-footer">
              <div>
                <button type="submit" className="btn btn-primary">
                  ➕ Create Product
                </button>
                <a className="btn btn-link" href="#" onClick={(e) => { e.preventDefault(); history.back(); }}>
                  Cancel
                </a>
              </div>
            </footer>
          </Form>
        </div>
      </div>
      <style jsx>{`
        .admin__dark { background: #111; color: #e6eef8; padding: 24px; }
        .form-card { max-width: 900px; margin: 0 auto; background: #0f1720; border-radius: 12px; padding: 20px; }
        .form-card__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px }
        .form-grid { display:flex; gap:12px; margin-bottom:12px }
        .two-cols > div { flex:1 }
        .three-cols > div { flex:1 }
        .image-row { display:flex; gap:8px; align-items:center; margin-bottom:8px }
        .thumb img { width:48px; height:48px; object-fit:cover; border-radius:6px }
        .tags-container { display:flex; gap:8px; flex-wrap:wrap; max-height:120px; overflow:auto }
        .tag { padding:6px 10px; border-radius:999px; background:#1f2937; color:#cbd5e1; border:0 }
        .tag.selected { background:#10b981; color:#042014 }
        .form-footer { display:flex; justify-content:flex-start; gap:12px; margin-top:20px }
        .error { color:#ff7b7b; font-size:12px }
        .slug-preview { font-size:12px; color:#94a3b8; margin-top:6px }
      `}</style>
    </AdminLayout>
  );
}
