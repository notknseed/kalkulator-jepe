// Kalkulator Jepe logic ported to Next.js API route
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      token_name,
      total_supply,
      user_allocation,
      target_value,
      calculation_mode,
      circulating_supply
    } = req.body;

    // Validation
    if (!token_name || !total_supply || !user_allocation || !target_value || !calculation_mode) {
      return res.status(400).json({
        success: false,
        errors: ['Semua field harus diisi']
      });
    }

    if (calculation_mode === 'Market Cap' && !circulating_supply) {
      return res.status(400).json({
        success: false,
        errors: ['Initial Supply harus diisi untuk perhitungan Market Cap']
      });
    }

    // Calculate token price
    let token_price;
    let fdv_value = null;

    if (calculation_mode === 'FDV') {
      token_price = target_value / total_supply;
      fdv_value = target_value;
    } else { // Market Cap
      token_price = target_value / circulating_supply;
      fdv_value = token_price * total_supply;
    }

    // Calculate allocation value
    const allocation_value = user_allocation * token_price;

    // Generate moonsheet message
    const moonsheet = generateMoonsheet(allocation_value, token_price);

    // Generate formula
    const formula = calculation_mode === 'FDV' 
      ? `Token Price = Target FDV (${target_value.toLocaleString()}) ÷ Max Supply (${total_supply.toLocaleString()})`
      : `Token Price = Target Market Cap (${target_value.toLocaleString()}) ÷ Initial Supply (${circulating_supply.toLocaleString()})`;

    return res.status(200).json({
      success: true,
      token_price,
      allocation_value,
      formula,
      calculation_mode,
      fdv_value,
      moonsheet
    });

  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({
      success: false,
      errors: ['Terjadi kesalahan saat menghitung']
    });
  }
}

function generateMoonsheet(allocation_value, token_price) {
  if (allocation_value >= 100000) {
    return {
      message: "🚀 MOONSHOT ALERT! Kamu bisa jadi milioner bro! Time to quit your day job dan jadi crypto influencer!",
      color: "green"
    };
  } else if (allocation_value >= 50000) {
    return {
      message: "💎 Diamond hands baby! Ini duit semester kuliah atau DP motor baru nih!",
      color: "green"
    };
  } else if (allocation_value >= 10000) {
    return {
      message: "📈 Not bad! Lumayan buat jajan atau upgrade setup gaming kamu!",
      color: "blue"
    };
  } else if (allocation_value >= 1000) {
    return {
      message: "😊 Oke lah! Cukup buat makan enak beberapa kali atau beli skin game favorit!",
      color: "yellow"
    };
  } else if (allocation_value >= 100) {
    return {
      message: "😐 Ya... lumayan lah buat beli kopi starbucks seminggu atau top up game mobile.",
      color: "orange"
    };
  } else {
    return {
      message: "😅 Hmm... mungkin cukup buat beli permen atau top up pulsa. Better than nothing!",
      color: "red"
    };
  }
}