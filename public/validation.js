(function() {
    'use strict';
    window.addEventListener('load', function() {
      var forms = document.getElementsByClassName('needs-validation');
      var validation = Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
          if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
          }
          form.classList.add('was-validated');
        }, false);
      });
    }, false);
  })();

  document.getElementById('addBtn').addEventListener('click', function() {
    var totalCans = document.getElementById('totalCans');
    if (parseInt(totalCans.value) < 30) { 
      totalCans.value = parseInt(totalCans.value) + 1;
    }
  });

  document.getElementById('subtractBtn').addEventListener('click', function() {
    var totalCans = document.getElementById('totalCans');
    if (parseInt(totalCans.value) > 1) {
      totalCans.value = parseInt(totalCans.value) - 1;
    }
  });

  document.getElementById('orderForm').addEventListener('submit', async function(event) {
  event.preventDefault(); 
}); 
