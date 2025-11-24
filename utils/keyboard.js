const productsData = require('../data/products.json');
const products = productsData.products;

class Keyboard {
  static mainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Болгарки', callback_data: 'category_Болгарки' }],
          [{ text: '📐 Лазерные уровни', callback_data: 'category_Лазерные уровни' }],
          [{ text: '⚡ Шуруповёрты', callback_data: 'category_Шуруповёрты' }],
          [{ text: '🛠️ Дрели', callback_data: 'category_Дрели' }],
          [{ text: '⚒️ Перфораторы', callback_data: 'category_Перфораторы' }],
          [{ text: '📦 Наборы инструментов', callback_data: 'category_Наборы инструментов' }],
          [{ text: '🔧 Насадки и аксессуары', callback_data: 'category_Насадки и аксессуары' }],
          [{ text: '📏 Измерительные инструменты', callback_data: 'category_Измерительные инструменты' }],
          [{ text: '🌀 Шлифовальные машины', callback_data: 'category_Шлифовальные машины' }],
          [{ text: '🔩 Гайковёрты', callback_data: 'category_Гайковёрты' }],
          [{ text: '🔥 Тепловое оборудование', callback_data: 'category_Тепловое оборудование' }],
          [{ text: '📹 Эндоскопы', callback_data: 'category_Эндоскопы' }],
          [{ text: '🛠️ Прочие инструменты', callback_data: 'category_Прочие инструменты' }],
          [{ text: '💧 Насосы и опрыскиватели', callback_data: 'category_Насосы и опрыскиватели' }]
        ]
      }
    };
  }

  // ... остальные методы остаются без изменений
  static categoryBrands(category) {
    const categoryBrands = products[category] ? Object.keys(products[category]) : [];
    const keyboard = categoryBrands.map(brand => [
      { 
        text: brand, 
        callback_data: `brand_${category}_${brand}` 
      }
    ]);
    
    keyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_categories' }]);
    
    return {
      reply_markup: {
        inline_keyboard: keyboard
      }
    };
  }

  static brandProducts(category, brand) {
    const brandProducts = products[category] && products[category][brand] ? products[category][brand] : [];
    const keyboard = brandProducts.map(product => [
      { 
        text: `${product.name} - ${product.price} сум`, 
        callback_data: `product_${product.id}` 
      }
    ]);
    
    keyboard.push([{ text: '⬅️ Назад к брендам', callback_data: `category_${category}` }]);
    
    return {
      reply_markup: {
        inline_keyboard: keyboard
      }
    };
  }

  static productOptions(productId) {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛒 Купить', callback_data: `buy_${productId}` }],
          [{ text: '⬅️ Назад к товарам', callback_data: 'back_to_products' }]
        ]
      }
    };
  }

  static deliveryOptions() {
    return {
      reply_markup: {
        keyboard: [
          ['🚗 Самовывоз'],
          ['📦 Доставка'],
          ['⬅️ Отмена']
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };
  }

  static locationRequest() {
    return {
      reply_markup: {
        keyboard: [
          [{ text: '📍 Отправить локацию', request_location: true }],
          ['⬅️ Отмена']
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };
  }

  static paymentOptions(deliveryType) {
    if (deliveryType === '🚗 Самовывоз') {
      return {
        reply_markup: {
          keyboard: [
            ['💳 Картой', '💵 Наличными'],
            ['⬅️ Отмена']
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      };
    } else {
      return {
        reply_markup: {
          keyboard: [
            ['💳 Оплата картой'],
            ['⬅️ Отмена']
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      };
    }
  }

  static adminOrderActions(orderId) {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✔️ Подтвердить заказ', callback_data: `approve_${orderId}` }],
          [{ text: '❌ Отклонить', callback_data: `reject_${orderId}` }]
        ]
      }
    };
  }

  static adminPaymentActions(orderId) {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💰 Подтвердить оплату', callback_data: `payment_confirm_${orderId}` }],
          [{ text: '❌ Отклонить', callback_data: `reject_${orderId}` }]
        ]
      }
    };
  }

  static removeKeyboard() {
    return {
      reply_markup: {
        remove_keyboard: true
      }
    };
  }
}

module.exports = Keyboard;