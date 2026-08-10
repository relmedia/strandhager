# Exercises the booking API end to end against a running dev server.
$ErrorActionPreference = "Stop"
$api = "http://localhost:4000"

function Show($label, $value) {
  Write-Host "`n--- $label ---" -ForegroundColor Cyan
  $value | ConvertTo-Json -Depth 6 -Compress
}

$space = Invoke-RestMethod "$api/spaces/felleshuset"
Show "space" $space

$start = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
$end = (Get-Date).AddDays(31).ToString("yyyy-MM-dd")

$avail = Invoke-RestMethod "$api/availability?space=felleshuset&from=$start&to=$end"
Show "availability" $avail

$quote = Invoke-RestMethod "$api/pricing/quote?space=felleshuset&from=$start&to=$end"
Show "quote" $quote

$body = @{
  space     = "felleshuset"
  startDate = $start
  endDate   = $end
  guests    = 30
  firstName = "Kari"
  lastName  = "Nordmann"
  email     = "kari@example.com"
  phone     = "900 00 000"
  purpose   = "Bryllup"
  message   = "Vi kommer dagen før for å pynte."
} | ConvertTo-Json

$created = Invoke-RestMethod "$api/bookings" -Method Post -Body $body -ContentType "application/json"
Show "created" $created

$ref = $created.booking.reference
$token = $created.cancelToken

$lookup = Invoke-RestMethod "$api/bookings/reference/$ref`?token=$token"
Show "lookup" $lookup

# The same days must now be refused.
try {
  Invoke-RestMethod "$api/bookings" -Method Post -Body $body -ContentType "application/json" | Out-Null
  Write-Host "`nCONFLICT CHECK FAILED: duplicate was accepted" -ForegroundColor Red
} catch {
  Write-Host "`nconflict rejected: $($_.ErrorDetails.Message)" -ForegroundColor Green
}

# Bad input must be refused.
try {
  $bad = ($body | ConvertFrom-Json)
  $bad.email = "not-an-email"
  Invoke-RestMethod "$api/bookings" -Method Post -Body ($bad | ConvertTo-Json) -ContentType "application/json" | Out-Null
  Write-Host "VALIDATION CHECK FAILED: bad email was accepted" -ForegroundColor Red
} catch {
  Write-Host "validation rejected: $($_.ErrorDetails.Message)" -ForegroundColor Green
}

$list = Invoke-RestMethod "$api/bookings"
Show "list count" $list.Count

$summary = Invoke-RestMethod "$api/bookings/summary"
Show "summary" $summary

$confirmed = Invoke-RestMethod "$api/bookings/$($list[0].id)" -Method Patch `
  -Body (@{ status = "CONFIRMED"; paymentStatus = "PAID"; notes = "Ringt og avtalt nøkkel." } | ConvertTo-Json) `
  -ContentType "application/json"
Show "confirmed" $confirmed

$cancelled = Invoke-RestMethod "$api/bookings/reference/$ref/cancel" -Method Post `
  -Body (@{ token = $token; reason = "Endret planer" } | ConvertTo-Json) `
  -ContentType "application/json"
Show "cancelled by guest" $cancelled

# Cancelling releases the days again.
$availAfter = Invoke-RestMethod "$api/availability?space=felleshuset&from=$start&to=$end"
Show "availability after cancel" $availAfter

Invoke-RestMethod "$api/bookings/$($list[0].id)" -Method Delete | Out-Null
Write-Host "`ncleaned up test booking" -ForegroundColor Green
