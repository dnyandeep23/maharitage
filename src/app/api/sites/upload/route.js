import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { normalizeData } from '@/lib/normalize';
import connectDB from '../../../../lib/mongoose';
import TempSite from '../../../../models/TempSite';

// Handle POST request for JSON file upload
export async function POST(req) {
  try {
    await connectDB();

    // 1. Verify Role (Admin or Researcher)
    // Assuming token is in authorization header or cookies
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'researcher') {
      return NextResponse.json({ error: 'Forbidden. Insufficient permissions.' }, { status: 403 });
    }

    // 2. Parse the uploaded JSON
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();
    let jsonData;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 });
    }

    // Support batch uploads (array of objects) or single object
    const itemsToProcess = Array.isArray(jsonData) ? jsonData : [jsonData];
    const results = [];
    const errors = [];

    // 3. Normalize and Process each item
    for (const item of itemsToProcess) {
      try {
        const normalizedItem = normalizeData(item);
        
        // Basic validation
        if (!normalizedItem.site_name || !normalizedItem.heritage_type) {
           errors.push({ item: normalizedItem.site_name || 'Unknown', error: 'Missing site_name or heritage_type' });
           continue;
        }

        // Generate a random temp ID or use existing
        const siteId = normalizedItem.site_id || `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const tempSite = new TempSite({
          ...normalizedItem,
          site_id: siteId,
          status: 'pending',
          action: 'add',
          type: 'site',
          researchExpertId: decoded.id // tracking who uploaded it
        });

        await tempSite.save();
        results.push({ site_name: normalizedItem.site_name, site_id: siteId, status: 'success' });
      } catch (err) {
         errors.push({ item: item.site_name || 'Unknown', error: err.message });
      }
    }

    return NextResponse.json({ 
      message: 'Upload processed', 
      successCount: results.length,
      errorsCount: errors.length,
      results,
      errors
    }, { status: 200 });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
