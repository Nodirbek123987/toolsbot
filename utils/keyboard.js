class Keyboard {
  static mainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Болгарки', callback_data: 'cat_1' }],
          [{ text: '📐 Лазерные уровни', callback_data: 'cat_2' }],
          [{ text: '⚡ Шуруповёрты', callback_data: 'cat_3' }],
          [{ text: '🛠️ Дрели', callback_data: 'cat_4' }],
          [{ text: '⚒️ Перфораторы', callback_data: 'cat_5' }],
          [{ text: '📦 Наборы', callback_data: 'cat_6' }],
          [{ text: '🔧 Аксессуары', callback_data: 'cat_7' }],
          [{ text: '📏 Измерения', callback_data: 'cat_8' }],
          [{ text: '🌀 Шлифмашины', callback_data: 'cat_9' }],
          [{ text: '🔩 Гайковёрты', callback_data: 'cat_10' }],
          [{ text: '🔥 Тепловые', callback_data: 'cat_11' }],
          [{ text: '📹 Эндоскопы', callback_data: 'cat_12' }],
          [{ text: '🛠️ Прочие', callback_data: 'cat_13' }],
          [{ text: '💧 Насосы', callback_data: 'cat_14' }],
          [{ text: '🔨 Фрезеры', callback_data: 'cat_15' }],
          [{ text: '⚡ Электро', callback_data: 'cat_16' }]
        ]
      }
    };
  }

  static categoryBrands(categoryId, products) {
    const categoryMap = {
      'cat_1': 'Болгарки',
      'cat_2': 'Лазерные уровни',
      'cat_3': 'Шуруповёрты',
      'cat_4': 'Дрели',
      'cat_5': 'Перфораторы',
      'cat_6': 'Наборы инструментов',
      'cat_7': 'Насадки и аксессуары',
      'cat_8': 'Измерительные инструменты',
      'cat_9': 'Шлифовальные машины',
      'cat_10': 'Гайковёрты',
      'cat_11': 'Тепловое оборудование',
      'cat_12': 'Эндоскопы',
      'cat_13': 'Прочие инструменты',
      'cat_14': 'Насосы и опрыскиватели',
      'cat_15': 'Фрезеры',
      'cat_16': 'Электрооборудование'
    };

    const categoryName = categoryMap[categoryId];
    
    // Получаем бренды для данной категории
    const categoryBrands = products[categoryName] ? Object.keys(products[categoryName]) : [];
    
    const keyboard = categoryBrands.map(brand => {
      const brandId = this.getBrandId(brand);
      return [{ 
        text: brand, 
        callback_data: `brand_${categoryId}_${brandId}` 
      }];
    });
    
    keyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_categories' }]);
    
    return {
      reply_markup: {
        inline_keyboard: keyboard
      }
    };
  }

  static brandProducts(categoryId, brandId, products) {
    const categoryMap = {
      'cat_1': 'Болгарки',
      'cat_2': 'Лазерные уровни',
      'cat_3': 'Шуруповёрты',
      'cat_4': 'Дрели',
      'cat_5': 'Перфораторы',
      'cat_6': 'Наборы инструментов',
      'cat_7': 'Насадки и аксессуары',
      'cat_8': 'Измерительные инструменты',
      'cat_9': 'Шлифовальные машины',
      'cat_10': 'Гайковёрты',
      'cat_11': 'Тепловое оборудование',
      'cat_12': 'Эндоскопы',
      'cat_13': 'Прочие инструменты',
      'cat_14': 'Насосы и опрыскиватели',
      'cat_15': 'Фрезеры',
      'cat_16': 'Электрооборудование'
    };

    const brandMap = {
      'makita': 'Makita',
      'bosch': 'Bosch',
      'dewalt': 'DeWalt',
      'milwaukee': 'Milwaukee',
      'onex': 'ONE X',
      'interskol': 'Интерскол',
      'crown': 'Crown',
      'univ': 'Универсальные',
      'slavmash': 'Славмаш',
      'uni_t': 'UNI-T',
      'richda': 'Richda',
      'ingco': 'INGCO',
      'leo': 'LEO',
      'raznie': 'Разные',
      'komplekt': 'Комплект',
      'prochie': 'Прочие'
    };

    const categoryName = categoryMap[categoryId];
    const brandName = brandMap[brandId];
    
    // Проверяем существование категории и бренда
    const brandProducts = products[categoryName] && products[categoryName][brandName] 
      ? products[categoryName][brandName] 
      : [];
    
    const keyboard = brandProducts.map(product => [
      { 
        text: `${product.name} - ${product.price} сум`, 
        callback_data: `product_${product.id}` 
      }
    ]);
    
    keyboard.push([{ text: '⬅️ Назад к брендам', callback_data: categoryId }]);
    
    return {
      reply_markup: {
        inline_keyboard: keyboard
      }
    };
  }

  static getBrandId(brandName) {
    const brandMap = {
      'Makita': 'makita',
      'Bosch': 'bosch',
      'DeWalt': 'dewalt',
      'Milwaukee': 'milwaukee',
      'ONE X': 'onex',
      'Интерскол': 'interskol',
      'Crown': 'crown',
      'Универсальные': 'univ',
      'Славмаш': 'slavmash',
      'UNI-T': 'uni_t',
      'Richda': 'richda',
      'INGCO': 'ingco',
      'LEO': 'leo',
      'Разные': 'raznie',
      'Комплект': 'komplekt',
      'Прочие': 'prochie'
    };
    
    return brandMap[brandName] || brandName.toLowerCase();
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