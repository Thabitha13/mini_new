(function () {
  'use strict';
  window.addEventListener('load', function () {
    var forms = document.getElementsByClassName('needs-validation');
    var validation = Array.prototype.filter.call(forms, function (form) {
      form.addEventListener('submit', function (event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  }, false);
})();

document.getElementById('addBtn').addEventListener('click', function () {
  var totalCans = document.getElementById('totalCans');
  if (parseInt(totalCans.value) < 30) {
    totalCans.value = parseInt(totalCans.value) + 1;
  }
});

document.getElementById('subtractBtn').addEventListener('click', function () {
  var totalCans = document.getElementById('totalCans');
  if (parseInt(totalCans.value) > 1) {
    totalCans.value = parseInt(totalCans.value) - 1;
  }
});

async function updateMapWithOrders() {
  try {
    const response = await fetch('/Orders');
    if (response.ok) {
      const orders = await response.json();
      map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      orders.forEach(order => {
        L.marker([order.latitude, order.longitude]).addTo(map);
      });
    } else {
      console.error('Failed to fetch orders:', response.statusText);
    }
  } catch (error) {
    console.error('An error occurred while fetching orders:', error);
  }
}

document.getElementById('orderForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const formData = new FormData(this);
  const formDataJson = {};
  formData.forEach((value, key) => {
    formDataJson[key] = value;
  });
  formDataJson["phoneNo"] = document.getElementById("phoneNo").value;
  // console.log("Data: " + document.getElementById("phoneNo").value)
  console.log(formDataJson)

  try {
    const response = await fetch('http://localhost:4000/Orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formDataJson)
    });

    if (response.ok) {
      console.log('Order submitted successfully');
      alert('Booking successful! Your order has been placed.');
    } else {
      console.error('Order submission failed:', response.statusText);
      alert('Booking failed. Please try again later.');
    }
  } catch (error) {
    console.error('An error occurred during order submission:', error);
    alert('An error occurred. Please try again later.');
  }
});


