"use client";

import { useState } from "react";

import "./organization-details-screen.css";

export function OrganizationDetailsScreen() {
  const [institutionName, setInstitutionName] = useState("Mambu - Demo");
  const [street1, setStreet1] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [timeZone, setTimeZone] = useState("Europe/Madrid");
  const [dateFormat, setDateFormat] = useState("dd-MM-yyyy");
  const [dateTimeFormat, setDateTimeFormat] = useState("dd-MM-yyyy HH:mm:ss");

  return (
    <div className="zelify-org-details">
      <form className="zelify-org-details__form" onSubmit={(e) => e.preventDefault()}>
        <div className="zelify-org-details__field zelify-org-details__field--full">
          <label className="zelify-org-details__label" htmlFor="org-institution">
            Institution Name
          </label>
          <input
            id="org-institution"
            className="zelify-org-details__input"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            autoComplete="organization"
          />
        </div>

        <div className="zelify-org-details__field zelify-org-details__field--full">
          <label className="zelify-org-details__label" htmlFor="org-street1">
            Street Address - Line 1
          </label>
          <input
            id="org-street1"
            className="zelify-org-details__input"
            value={street1}
            onChange={(e) => setStreet1(e.target.value)}
            autoComplete="street-address"
          />
        </div>

        <div className="zelify-org-details__grid">
          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-city">
              City
            </label>
            <input
              id="org-city"
              className="zelify-org-details__input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
            />
          </div>
          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-region">
              State/Province/Region
            </label>
            <input
              id="org-region"
              className="zelify-org-details__input"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              autoComplete="address-level1"
            />
          </div>

          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-zip">
              Zip Postal Code
            </label>
            <input
              id="org-zip"
              className="zelify-org-details__input"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              autoComplete="postal-code"
            />
          </div>
          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-country">
              Country
            </label>
            <input
              id="org-country"
              className="zelify-org-details__input"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              autoComplete="country-name"
            />
          </div>

          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-mobile">
              Mobile Phone
            </label>
            <input
              id="org-mobile"
              className="zelify-org-details__input"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-email">
              Email
            </label>
            <input
              id="org-email"
              type="email"
              className="zelify-org-details__input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-currency">
              Currency
            </label>
            <select
              id="org-currency"
              className="zelify-org-details__select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="GBP">British Pound (GBP)</option>
            </select>
          </div>
          <div className="zelify-org-details__field">
            <label className="zelify-org-details__label" htmlFor="org-tz">
              Time Zone
            </label>
            <select
              id="org-tz"
              className="zelify-org-details__select"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
            >
              <option value="Europe/Madrid">Europe/Madrid</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
            </select>
          </div>

          <div className="zelify-org-details__field">
            <span className="zelify-org-details__label-row">
              <label className="zelify-org-details__label" htmlFor="org-date-fmt">
                Local Date Format
              </label>
              <button
                type="button"
                className="zelify-org-details__help"
                aria-label="Ayuda sobre formato de fecha"
                title="Formato local de fecha"
              >
                <HelpIcon />
              </button>
            </span>
            <input
              id="org-date-fmt"
              className="zelify-org-details__input"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
            />
          </div>
          <div className="zelify-org-details__field">
            <span className="zelify-org-details__label-row">
              <label className="zelify-org-details__label" htmlFor="org-dt-fmt">
                Local Date/Time Format
              </label>
              <button
                type="button"
                className="zelify-org-details__help"
                aria-label="Ayuda sobre formato de fecha y hora"
                title="Formato local de fecha y hora"
              >
                <HelpIcon />
              </button>
            </span>
            <input
              id="org-dt-fmt"
              className="zelify-org-details__input"
              value={dateTimeFormat}
              onChange={(e) => setDateTimeFormat(e.target.value)}
            />
          </div>
        </div>
      </form>
    </div>
  );
}

function HelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M5.2 5.4c0-.7.6-1.2 1.4-1.2.9 0 1.4.5 1.4 1.1 0 .8-.4 1.1-.9 1.4-.4.3-.6.5-.6 1.1V9"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <circle cx="7" cy="10.2" r="0.55" fill="currentColor" />
    </svg>
  );
}
