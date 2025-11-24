require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const Keyboard = require('./utils/keyboard');

// Загрузка данных
const productsData = require('./data/products.json');
const products = productsData.products;
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');

// Константы
const DELIVERY_COST = 30000;
const PICKUP_LOCATION = {
  latitude: 41.23863342225998,
  longitude: 69.33293278867168,
  address: "Базар Куйлюк 1 павильон 13 магазин"
};

// Инициализация бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Убедимся, что файл orders.json существует
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}

// Временное хранилище для данных пользователей
const userStates = new Map();

// Функции для работы с заказами
function loadOrders() {
  try {
    const data = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveOrder(order) {
  const orders = loadOrders();
  order.id = Date.now();
  order.status = 'pending';
  order.createdAt = new Date().toISOString();
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return order.id;
}

function updateOrderStatus(orderId, status) {
  const orders = loadOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    return order;
  }
  return null;
}

// Функция для расчета общей суммы
function calculateTotalAmount(productPrice, deliveryType) {
  try {
    if (!productPrice) return 0;
    
    const productPriceNum = parseInt(productPrice.toString().replace(/\s/g, ''));
    if (isNaN(productPriceNum)) return 0;
    
    if (deliveryType === '📦 Доставка') {
      return productPriceNum + DELIVERY_COST;
    }
    return productPriceNum;
  } catch (error) {
    console.error('Error calculating total amount:', error);
    return 0;
  }
}

// Функция для форматирования суммы
function formatPrice(price) {
  try {
    if (!price && price !== 0) return '0';
    
    const priceNum = typeof price === 'string' ? parseInt(price.replace(/\s/g, '')) : price;
    if (isNaN(priceNum)) return '0';
    
    return priceNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  } catch (error) {
    console.error('Error formatting price:', error);
    return '0';
  }
}

// Обработчики команд
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeText = `🛠 Добро пожаловать в магазин электроинструментов!\n\nВыберите категорию инструментов:`;

  bot.sendMessage(chatId, welcomeText, Keyboard.mainMenu());
});

// Обработка callback_query (нажатия на inline-кнопки)
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  try {
    if (data.startsWith('category_')) {
      const category = data.replace('category_', '');
      const categoryText = `🔧 ${category}\n\nВыберите товар:`;
      
      await bot.editMessageText(categoryText, {
        chat_id: chatId,
        message_id: message.message_id,
        ...Keyboard.categoryProducts(category)
      });
    }
    else if (data.startsWith('product_')) {
      const productId = parseInt(data.replace('product_', ''));
      
      // Находим товар во всех категориях
      let product = null;
      let categoryName = '';
      
      for (const [category, items] of Object.entries(products)) {
        const foundProduct = items.find(p => p.id === productId);
        if (foundProduct) {
          product = foundProduct;
          categoryName = category;
          break;
        }
      }
      
      if (product) {
        const productText = `🛠 ${product.name}\n⚡ Мощность: ${product.power}\n💰 Цена: ${product.price} сум\n📝 Описание: ${product.description}`;
        
        await bot.editMessageText(productText, {
          chat_id: chatId,
          message_id: message.message_id,
          ...Keyboard.productOptions(productId)
        });
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Товар не найден' });
      }
    }
    else if (data.startsWith('buy_')) {
      const productId = parseInt(data.replace('buy_', ''));
      
      // Сохраняем состояние пользователя
      userStates.set(chatId, { 
        step: 'waiting_name', 
        productId: productId 
      });
      
      await bot.deleteMessage(chatId, message.message_id);
      await bot.sendMessage(chatId, 'Для оформления заказа введите ваше имя:', Keyboard.removeKeyboard());
    }
    else if (data === 'back_to_categories') {
      await bot.editMessageText('Выберите категорию инструментов:', {
        chat_id: chatId,
        message_id: message.message_id,
        ...Keyboard.mainMenu()
      });
    }
    else if (data.startsWith('approve_')) {
      // Обработка подтверждения заказа админом
      if (chatId.toString() !== process.env.ADMIN_ID) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'У вас нет прав для этого действия' });
      }
      
      const orderId = parseInt(data.replace('approve_', ''));
      const order = updateOrderStatus(orderId, 'approved');
      
      if (order) {
        // Уведомляем админа
        await bot.editMessageText(`✅ Заказ #${orderId} подтвержден`, {
          chat_id: chatId,
          message_id: message.message_id
        });
        
        // Рассчитываем общую сумму
        const totalAmount = order.totalAmount || calculateTotalAmount(order.productPrice, order.delivery);
        
        // Определяем сообщение в зависимости от способа оплаты
        let paymentMessage = '';
        
        if (order.paymentMethod === 'card') {
          paymentMessage = `💳 Для оплаты переведите сумму ${formatPrice(totalAmount)} сум на карту:\n💳 **5614 6822 1296 5745**\n\nПосле оплаты отправьте скриншот чека в ответном сообщении.`;
        } else if (order.paymentMethod === 'cash') {
          paymentMessage = `💵 Оплата наличными при получении.\nСумма к оплате: ${formatPrice(totalAmount)} сум`;
        } else {
          paymentMessage = `💳 Для оплаты переведите сумму ${formatPrice(totalAmount)} сум на карту:\n💳 **5614 6822 1296 5745**\n\nИли оплатите наличными при получении.`;
        }

        // Уведомляем пользователя
        const userMessage = `✅ Ваш заказ подтверждён!\n\nТовар: ${order.productName}\nЦена товара: ${order.productPrice} сум\n${order.delivery === '📦 Доставка' ? `Доставка: ${formatPrice(DELIVERY_COST)} сум\n` : ''}💵 Общая сумма: ${formatPrice(totalAmount)} сум\nСпособ оплаты: ${order.paymentMethod === 'card' ? 'Картой' : order.paymentMethod === 'cash' ? 'Наличными' : 'Не указан'}\n\n${paymentMessage}`;

        await bot.sendMessage(order.userId, userMessage, Keyboard.removeKeyboard());
        
        // Сохраняем состояние для ожидания скриншота, если оплата картой
        if (order.paymentMethod === 'card') {
          userStates.set(order.userId, {
            step: 'waiting_screenshot',
            orderId: orderId
          });
        }
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Заказ не найден' });
      }
      
      await bot.answerCallbackQuery(callbackQuery.id);
    }
    else if (data.startsWith('reject_')) {
      // Обработка отклонения заказа админом
      if (chatId.toString() !== process.env.ADMIN_ID) {
        return bot.answerCallbackQuery(callbackQuery.id, { text: 'У вас нет прав для этого действия' });
      }
      
      const orderId = parseInt(data.replace('reject_', ''));
      const order = updateOrderStatus(orderId, 'rejected');
      
      if (order) {
        await bot.editMessageText(`❌ Заказ #${orderId} отклонен`, {
          chat_id: chatId,
          message_id: message.message_id
        });
        
        await bot.sendMessage(order.userId, '❌ К сожалению, ваш заказ был отклонен администратором.', Keyboard.removeKeyboard());
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Заказ не найден' });
      }
      
      await bot.answerCallbackQuery(callbackQuery.id);
    }
  } catch (error) {
    console.error('Error handling callback:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Произошла ошибка' });
  }
});

// Обработка текстовых сообщений (для сбора данных пользователя)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userState = userStates.get(chatId);

  // Пропускаем команды
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  if (!userState) return;

  try {
    if (userState.step === 'waiting_name') {
      userState.userName = text;
      userState.step = 'waiting_phone';
      
      await bot.sendMessage(chatId, '📞 Введите ваш номер телефона:');
    }
    else if (userState.step === 'waiting_phone') {
      userState.userPhone = text;
      userState.step = 'waiting_delivery';
      
      await bot.sendMessage(chatId, '🚚 Выберите способ доставки:', Keyboard.deliveryOptions());
    }
    else if (userState.step === 'waiting_delivery' && (text === '🚗 Самовывоз' || text === '📦 Доставка')) {
      userState.delivery = text;
      
      if (text === '🚗 Самовывоз') {
        userState.step = 'waiting_payment';
        // Отправляем локацию самовывоза
        await bot.sendLocation(chatId, PICKUP_LOCATION.latitude, PICKUP_LOCATION.longitude);
        await bot.sendMessage(chatId, `📍 Адрес самовывоза: ${PICKUP_LOCATION.address}\n\n💳 Выберите способ оплаты:`, Keyboard.paymentOptions(userState.delivery));
      } else {
        userState.step = 'waiting_location';
        await bot.sendMessage(chatId, `📦 Доставка оплачивается отдельно: ${formatPrice(DELIVERY_COST)} сум\n\n📍 Пожалуйста, отправьте вашу локацию для доставки:`, Keyboard.locationRequest());
      }
    }
    else if (userState.step === 'waiting_location' && msg.location) {
      userState.deliveryLocation = {
        latitude: msg.location.latitude,
        longitude: msg.location.longitude
      };
      userState.step = 'waiting_payment';
      
      await bot.sendMessage(chatId, '📍 Локация получена! Теперь выберите способ оплаты:', Keyboard.paymentOptions(userState.delivery));
    }
    else if (userState.step === 'waiting_payment' && (text === '💳 Картой' || text === '💵 Наличными' || text === '💳 Оплата картой')) {
      userState.paymentMethod = text === '💳 Картой' || text === '💳 Оплата картой' ? 'card' : 'cash';
      
      // Находим информацию о товаре
      let product = null;
      for (const [category, items] of Object.entries(products)) {
        const foundProduct = items.find(p => p.id === userState.productId);
        if (foundProduct) {
          product = foundProduct;
          break;
        }
      }
      
      if (product) {
        // Рассчитываем общую сумму
        const totalAmount = calculateTotalAmount(product.price, userState.delivery);
        
        // Сохраняем заказ
        const order = {
          userId: chatId,
          userName: userState.userName,
          userPhone: userState.userPhone,
          delivery: userState.delivery,
          deliveryLocation: userState.deliveryLocation,
          paymentMethod: userState.paymentMethod,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productDescription: product.description,
          totalAmount: totalAmount,
          deliveryCost: userState.delivery === '📦 Доставка' ? DELIVERY_COST : 0
        };
        
        const orderId = saveOrder(order);
        
        // Формируем сообщение для админа
        let adminMessage = `🛒 НОВЫЙ ЗАКАЗ #${orderId}\n\nТовар: ${product.name}\nЦена товара: ${product.price} сум`;

        if (userState.delivery === '📦 Доставка') {
          adminMessage += `\nДоставка: ${formatPrice(DELIVERY_COST)} сум`;
        }
        
        adminMessage += `\n💵 Общая сумма: ${formatPrice(totalAmount)} сум\nОписание: ${product.description}\n\n👤 Клиент:\nИмя: ${userState.userName}\nТелефон: ${userState.userPhone}\nДоставка: ${userState.delivery}\nОплата: ${userState.paymentMethod === 'card' ? 'Картой' : 'Наличными'}`;

        if (userState.delivery === '📦 Доставка' && userState.deliveryLocation) {
          adminMessage += `\n📍 Локация доставки: ${userState.deliveryLocation.latitude}, ${userState.deliveryLocation.longitude}`;
          // Отправляем локацию админу
          await bot.sendLocation(process.env.ADMIN_ID, userState.deliveryLocation.latitude, userState.deliveryLocation.longitude);
        } else if (userState.delivery === '🚗 Самовывоз') {
          adminMessage += `\n📍 Самовывоз: ${PICKUP_LOCATION.address}`;
        }

        adminMessage += `\n\nID пользователя: ${chatId}`;

        await bot.sendMessage(process.env.ADMIN_ID, adminMessage, Keyboard.adminOrderActions(orderId));
        
        // Подтверждаем пользователю с общей суммой
        let userConfirmation = `✅ Ваш заказ принят!\n\nТовар: ${product.name}\nЦена товара: ${product.price} сум`;

        if (userState.delivery === '📦 Доставка') {
          userConfirmation += `\nДоставка: ${formatPrice(DELIVERY_COST)} сум`;
        }

        userConfirmation += `\n💵 Общая сумма: ${formatPrice(totalAmount)} сум\nДоставка: ${userState.delivery}\nОплата: ${userState.paymentMethod === 'card' ? 'Картой' : 'Наличными'}\n\nОжидайте подтверждения от администратора. Мы свяжемся с вами в ближайшее время.`;

        await bot.sendMessage(chatId, userConfirmation, Keyboard.removeKeyboard());
      } else {
        await bot.sendMessage(chatId, '❌ Товар не найден. Пожалуйста, начните заново.', Keyboard.removeKeyboard());
      }
      
      // Очищаем состояние пользователя
      userStates.delete(chatId);
    }
    else if (text === '⬅️ Отмена') {
      userStates.delete(chatId);
      await bot.sendMessage(chatId, 'Заказ отменен.', Keyboard.removeKeyboard());
      await bot.sendMessage(chatId, 'Выберите категорию инструментов:', Keyboard.mainMenu());
    }
    else if (userState.step === 'waiting_delivery') {
      // Если введен неправильный способ доставки
      await bot.sendMessage(chatId, '❌ Пожалуйста, выберите способ доставки из предложенных вариантов:', Keyboard.deliveryOptions());
    }
    else if (userState.step === 'waiting_location') {
      // Если не отправлена локация
      await bot.sendMessage(chatId, '❌ Пожалуйста, отправьте вашу локацию для доставки, используя кнопку ниже:', Keyboard.locationRequest());
    }
    else if (userState.step === 'waiting_payment') {
      // Если введен неправильный способ оплаты
      await bot.sendMessage(chatId, '❌ Пожалуйста, выберите способ оплаты из предложенных вариантов:', Keyboard.paymentOptions(userState.delivery));
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте снова.', Keyboard.removeKeyboard());
    userStates.delete(chatId);
  }
});

// Обработка фото (скриншоты чеков)
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const userState = userStates.get(chatId);

  // Если пользователь ожидает отправки скриншота
  if (userState && userState.step === 'waiting_screenshot') {
    const orderId = userState.orderId;
    const orders = loadOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
      // Отправляем скриншот админу
      const photoId = msg.photo[msg.photo.length - 1].file_id;
      const totalAmount = order.totalAmount || calculateTotalAmount(order.productPrice, order.delivery);
      const caption = `📸 Скриншот чека для заказа #${orderId}\n\nТовар: ${order.productName}\nСумма: ${formatPrice(totalAmount)} сум\nКлиент: ${order.userName}\nТелефон: ${order.userPhone}`;
      
      await bot.sendPhoto(process.env.ADMIN_ID, photoId, { caption: caption });
      
      // Подтверждаем пользователю
      await bot.sendMessage(chatId, '✅ Скриншот чека получен! Спасибо. Мы проверим оплату и свяжемся с вами для уточнения деталей доставки.');
      
      // Очищаем состояние пользователя
      userStates.delete(chatId);
    }
  }
});

// Команда для просмотра заказов (только для админа)
bot.onText(/\/orders/, (msg) => {
  const chatId = msg.chat.id;
  
  if (chatId.toString() !== process.env.ADMIN_ID) {
    return bot.sendMessage(chatId, 'У вас нет прав для этой команды.');
  }
  
  const orders = loadOrders();
  const pendingOrders = orders.filter(order => order.status === 'pending');
  
  if (pendingOrders.length === 0) {
    return bot.sendMessage(chatId, 'Нет ожидающих заказов.');
  }
  
  let ordersText = '📋 Ожидающие заказы:\n\n';
  
  pendingOrders.forEach(order => {
    try {
      ordersText += `🆔 #${order.id}\n`;
      ordersText += `Товар: ${order.productName}\n`;
      ordersText += `Цена товара: ${order.productPrice} сум\n`;
      if (order.delivery === '📦 Доставка') {
        ordersText += `Доставка: ${formatPrice(order.deliveryCost || DELIVERY_COST)} сум\n`;
      }
      const totalAmount = order.totalAmount || calculateTotalAmount(order.productPrice, order.delivery);
      ordersText += `Общая сумма: ${formatPrice(totalAmount)} сум\n`;
      ordersText += `Клиент: ${order.userName}\n`;
      ordersText += `Телефон: ${order.userPhone}\n`;
      ordersText += `Доставка: ${order.delivery}\n`;
      ordersText += `Оплата: ${order.paymentMethod === 'card' ? 'Картой' : order.paymentMethod === 'cash' ? 'Наличными' : 'Не указана'}\n`;
      ordersText += `Дата: ${new Date(order.createdAt).toLocaleString()}\n`;
      ordersText += '────────────────────\n';
    } catch (error) {
      console.error('Error formatting order:', order.id, error);
    }
  });
  
  bot.sendMessage(chatId, ordersText);
});

// Команда для просмотра всех заказов (только для админа)
bot.onText(/\/allorders/, (msg) => {
  const chatId = msg.chat.id;
  
  if (chatId.toString() !== process.env.ADMIN_ID) {
    return bot.sendMessage(chatId, 'У вас нет прав для этой команды.');
  }
  
  const orders = loadOrders();
  
  if (orders.length === 0) {
    return bot.sendMessage(chatId, 'Нет заказов.');
  }
  
  const statusEmoji = {
    'pending': '⏳',
    'approved': '✅',
    'rejected': '❌'
  };
  
  let ordersText = '📋 Все заказы:\n\n';
  
  orders.forEach(order => {
    try {
      ordersText += `${statusEmoji[order.status] || '📦'} Заказ #${order.id}\n`;
      ordersText += `Товар: ${order.productName}\n`;
      ordersText += `Цена товара: ${order.productPrice} сум\n`;
      if (order.delivery === '📦 Доставка') {
        ordersText += `Доставка: ${formatPrice(order.deliveryCost || DELIVERY_COST)} сум\n`;
      }
      const totalAmount = order.totalAmount || calculateTotalAmount(order.productPrice, order.delivery);
      ordersText += `Общая сумма: ${formatPrice(totalAmount)} сум\n`;
      ordersText += `Клиент: ${order.userName}\n`;
      ordersText += `Телефон: ${order.userPhone}\n`;
      ordersText += `Доставка: ${order.delivery}\n`;
      ordersText += `Оплата: ${order.paymentMethod === 'card' ? 'Картой' : order.paymentMethod === 'cash' ? 'Наличными' : 'Не указана'}\n`;
      ordersText += `Статус: ${order.status}\n`;
      ordersText += `Дата: ${new Date(order.createdAt).toLocaleString()}\n`;
      ordersText += '────────────────────\n';
    } catch (error) {
      console.error('Error formatting order:', order.id, error);
    }
  });
  
  bot.sendMessage(chatId, ordersText);
});

// Обработка ошибок бота
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
  console.error('Webhook error:', error);
});

console.log('🤖 Бот запущен и готов к работе...');
console.log('👤 Admin ID:', process.env.ADMIN_ID);