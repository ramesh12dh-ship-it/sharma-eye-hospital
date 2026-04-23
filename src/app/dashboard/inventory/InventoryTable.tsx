'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import Papa from 'papaparse'
import styles from './inventory.module.css'

type Product = {
  product_code: string
  lens_width: string | null
  brands: string | null
  location: string | null
  type: string | null
  comments: string | null
  mrp: number | null
  cost_price: number | null
  sale_price_s: number | null
  sale_price_a: number | null
  stock: number
  date_added: string
}

export default function InventoryTable({ initialProducts, userRole }: { initialProducts: Product[], userRole: string }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isAdding, setIsAdding] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ stock: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProduct.product_code) return alert('Product code is required')

    const { data, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()

    if (error) {
      alert('Error adding product: ' + error.message)
    } else if (data) {
      setProducts([data[0], ...products])
      setIsAdding(false)
      setNewProduct({ stock: 0 })
    }
  }

  const handleDownloadTemplate = () => {
    const headers = ['product_code', 'type', 'brands', 'lens_width', 'location', 'stock', 'cost_price', 'sale_price_s', 'sale_price_a', 'mrp', 'comments']
    const csvContent = headers.join(',') + '\n'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'inventory_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        
        // Convert string values to numbers where appropriate
        const formattedRows = rows.map(row => ({
          ...row,
          stock: parseInt(row.stock) || 0,
          cost_price: parseFloat(row.cost_price) || null,
          sale_price_s: parseFloat(row.sale_price_s) || null,
          sale_price_a: parseFloat(row.sale_price_a) || null,
          mrp: parseFloat(row.mrp) || null,
        }))

        // Basic validation: ensure product_code exists
        const validRows = formattedRows.filter(row => row.product_code)

        if (validRows.length === 0) {
          alert('No valid products found in CSV. Make sure "product_code" column exists.')
          setIsUploading(false)
          return
        }

        const { data, error } = await supabase
          .from('products')
          .insert(validRows)
          .select()

        if (error) {
          alert('Error uploading CSV: ' + error.message)
        } else if (data) {
          alert(`Successfully added ${data.length} products!`)
          setProducts([...data, ...products])
        }
        
        setIsUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error.message)
        setIsUploading(false)
      }
    })
  }

  const handleExportData = () => {
    if (products.length === 0) {
      return alert('No products to export.')
    }
    
    // Convert current products to CSV
    const csvContent = Papa.unparse(products)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'inventory_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      {userRole === 'admin' && (
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => setIsAdding(!isAdding)} className={styles.primaryBtn}>
            {isAdding ? 'Cancel' : '+ Add Single Product'}
          </button>
          <button onClick={handleDownloadTemplate} className={styles.secondaryBtn}>
            Download CSV Template
          </button>
          <div>
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef}
              style={{ display: 'none' }} 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={styles.secondaryBtn}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Bulk Upload CSV'}
            </button>
          </div>
          <button onClick={handleExportData} className={styles.secondaryBtn} style={{ marginLeft: 'auto' }}>
            Export Inventory CSV
          </button>
        </div>
      )}

      {isAdding && userRole === 'admin' && (
        <form onSubmit={handleAddProduct} className={styles.addForm}>
          <h3>Add New Product</h3>
          <div className={styles.grid}>
            <input required placeholder="Product Code (SKU)" value={newProduct.product_code || ''} onChange={(e) => setNewProduct({...newProduct, product_code: e.target.value})} className={styles.input} />
            <input placeholder="Type (e.g. SPECTACLE GLASS)" value={newProduct.type || ''} onChange={(e) => setNewProduct({...newProduct, type: e.target.value})} className={styles.input} />
            <input placeholder="Brand" value={newProduct.brands || ''} onChange={(e) => setNewProduct({...newProduct, brands: e.target.value})} className={styles.input} />
            <input placeholder="Lens Width" value={newProduct.lens_width || ''} onChange={(e) => setNewProduct({...newProduct, lens_width: e.target.value})} className={styles.input} />
            <input placeholder="Location" value={newProduct.location || ''} onChange={(e) => setNewProduct({...newProduct, location: e.target.value})} className={styles.input} />
            <input type="number" placeholder="Stock" value={newProduct.stock || 0} onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} className={styles.input} />
            <input type="number" placeholder="Cost Price" value={newProduct.cost_price || ''} onChange={(e) => setNewProduct({...newProduct, cost_price: parseFloat(e.target.value)})} className={styles.input} />
            <input type="number" placeholder="Sale Price S (Store)" value={newProduct.sale_price_s || ''} onChange={(e) => setNewProduct({...newProduct, sale_price_s: parseFloat(e.target.value)})} className={styles.input} />
            <input type="number" placeholder="Sale Price A (Accounts)" value={newProduct.sale_price_a || ''} onChange={(e) => setNewProduct({...newProduct, sale_price_a: parseFloat(e.target.value)})} className={styles.input} />
            <input type="number" placeholder="MRP" value={newProduct.mrp || ''} onChange={(e) => setNewProduct({...newProduct, mrp: parseFloat(e.target.value)})} className={styles.input} />
            <input placeholder="Comments" value={newProduct.comments || ''} onChange={(e) => setNewProduct({...newProduct, comments: e.target.value})} className={styles.input} style={{ gridColumn: '1 / -1' }} />
          </div>
          <button type="submit" className={styles.submitBtn}>Save Product</button>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Type</th>
              <th>Brand</th>
              <th>Stock</th>
              {userRole === 'admin' && <th>Cost Price</th>}
              <th>Sale Price S</th>
              {userRole === 'admin' && <th>Sale Price A</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.product_code}>
                <td>{p.product_code}</td>
                <td>{p.type}</td>
                <td>{p.brands}</td>
                <td><strong>{p.stock}</strong></td>
                {userRole === 'admin' && <td>₹{p.cost_price}</td>}
                <td>₹{p.sale_price_s}</td>
                {userRole === 'admin' && <td>₹{p.sale_price_a}</td>}
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
