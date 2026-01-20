// api/check-password.js
export default function handler(req, res) {
  // Hanya terima method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { password } = req.body;
  
  // Password diambil dari Environment Variable di Vercel
  const SECRET_PASSWORD = process.env.INTERNAL_PASSWORD;

  if (password === SECRET_PASSWORD) {
    res.status(200).json({ success: true, message: 'Akses diberikan' });
  } else {
    res.status(401).json({ success: false, message: 'Password salah' });
  }
}
