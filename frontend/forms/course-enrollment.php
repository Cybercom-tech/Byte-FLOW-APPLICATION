<?php
  /**
  * Course Enrollment Email Notification
  * Sends email to ByteFlow when a student enrolls in a course
  */

  // Replace with ByteFlow's receiving email address
  $receiving_email_address = 'info@byteflowinnovations.com';

  if( file_exists($php_email_form = '../assets/vendor/php-email-form/php-email-form.php' )) {
    include( $php_email_form );
  } else {
    die( 'Unable to load the "PHP Email Form" Library!');
  }

  $enrollment = new PHP_Email_Form;
  $enrollment->ajax = true;
  
  $enrollment->to = $receiving_email_address;
  $enrollment->from_name = isset($_POST['studentName']) ? $_POST['studentName'] : 'Student';
  $enrollment->from_email = isset($_POST['studentEmail']) ? $_POST['studentEmail'] : 'noreply@byteflowinnovations.com';
  // Determine email subject based on payment method
  $requiresVerification = isset($_POST['requiresVerification']) && $_POST['requiresVerification'] === 'true';
  $paymentMethod = isset($_POST['paymentMethod']) ? $_POST['paymentMethod'] : 'Unknown';
  
  if ($requiresVerification) {
    $enrollment->subject = '⚠️ VERIFICATION REQUIRED: Bank Transfer Enrollment - ' . (isset($_POST['courseTitle']) ? $_POST['courseTitle'] : 'Course Enrollment');
  } else {
    $enrollment->subject = '✅ New Course Enrollment: ' . (isset($_POST['courseTitle']) ? $_POST['courseTitle'] : 'Course Enrollment');
  }

  // Uncomment below code if you want to use SMTP to send emails. You need to enter your correct SMTP credentials
  /*
  $enrollment->smtp = array(
    'host' => 'smtp.example.com',
    'username' => 'your-email@example.com',
    'password' => 'your-password',
    'port' => '587'
  );
  */

  // Add course enrollment details to email
  $enrollment->add_message( isset($_POST['studentName']) ? $_POST['studentName'] : 'N/A', 'Student Name');
  $enrollment->add_message( isset($_POST['studentEmail']) ? $_POST['studentEmail'] : 'N/A', 'Student Email');
  $enrollment->add_message( isset($_POST['studentPhone']) ? $_POST['studentPhone'] : 'N/A', 'Student Phone');
  $enrollment->add_message( isset($_POST['studentAddress']) ? $_POST['studentAddress'] : 'N/A', 'Student Address');
  $enrollment->add_message( isset($_POST['studentCity']) ? $_POST['studentCity'] : 'N/A', 'Student City');
  $enrollment->add_message( isset($_POST['courseTitle']) ? $_POST['courseTitle'] : 'N/A', 'Course Title');
  $enrollment->add_message( isset($_POST['courseId']) ? $_POST['courseId'] : 'N/A', 'Course ID');
  $enrollment->add_message( isset($_POST['coursePrice']) ? 'PKR ' . number_format($_POST['coursePrice']) : 'N/A', 'Course Price');
  $enrollment->add_message( isset($_POST['totalAmount']) ? 'PKR ' . number_format($_POST['totalAmount']) : 'N/A', 'Total Amount Paid');
  $enrollment->add_message( isset($_POST['paymentMethod']) ? $_POST['paymentMethod'] : 'N/A', 'Payment Method');
  $enrollment->add_message( isset($_POST['transactionId']) ? $_POST['transactionId'] : 'N/A', 'Transaction ID');
  if ($requiresVerification && isset($_POST['bankName'])) {
    $enrollment->add_message( $_POST['bankName'], 'Student Bank Name');
  }
  $enrollment->add_message( date('Y-m-d H:i:s'), 'Enrollment Date');
  
  // Add important notice for bank transfers
  if ($requiresVerification) {
    $enrollment->add_message( '⚠️ ACTION REQUIRED: Please verify the bank transfer payment and activate this enrollment in the admin panel.', 'VERIFICATION REQUIRED');
    $enrollment->add_message( 'Student cannot access the course until payment is verified and enrollment is activated.', 'Note');
  }

  echo $enrollment->send();
?>

