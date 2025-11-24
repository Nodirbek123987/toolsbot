const productsData = require('../data/products.json');
const products = productsData.products;

class Keyboard {
  static mainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛠 Дрели', callback_data: 'category_Дрели' }],
          [{ text: '⚡ Шуруповёрты', callback_data: 'category_Шуруповёрты' }],
          [{ text: '🔥 Болгарки', callback_data: 'category_Болгарки' }],
          [{ text: '🔧 Гайковёрты', callback_data: 'category_Гайковёрты' }]
        ]
      }
    };
  }

  static categoryProducts(category) {
    const categoryProducts = products[category] || [];
    const keyboard = categoryProducts.map(product => [
      { 
        text: `${product.name} - ${product.price} сум`, 
        callback_data: `product_${product.id}` 
      }
    ]);
    
    // Добавляем кнопку "Назад"
    keyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_categories' }]);
    
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
          [{ text: '⬅️ Назад к категориям', callback_data: 'back_to_categories' }]
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
      // Для доставки только картой
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