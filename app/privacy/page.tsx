import type { Metadata } from "next";
import { BlogFooter, BlogHeader } from "@/app/blog/components";
import { POLICY_VERSION, PRIVACY_EMAIL } from "@/lib/privacy";
import "@/app/blog/blog.css";

export const metadata: Metadata = {
  title: "Privacy Policy | BoatUneet",
  description:
    "How UNEET GROUP S.R.L., operating BoatUNEET, collects, uses, stores, shares and protects personal data, including Meta lead forms, cookies and your rights.",
  alternates: { canonical: "/privacy" },
};

const ADDRESS =
  "București Sectorul 1, Bulevardul G-RAL GHEORGHE MAGHERU, Nr. 31, Birou 2, Etaj 5, 030167, Romania";
const PHONE = "+385 99 321 7442";
const Mail = () => <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>;

const SECTIONS = [
  "Data Controller",
  "Personal Data We Collect",
  "How We Collect Personal Data",
  "Purposes and Legal Bases",
  "Meta Lead Ads, Facebook and Instagram",
  "WhatsApp and Other Communications",
  "Cookies, Analytics and Advertising Technologies",
  "Recipients and Service Providers",
  "International Data Transfers",
  "Data Retention",
  "Automated Decision-Making and Human Review",
  "Your Data-Protection Rights",
  "Email Marketing",
  "Security",
  "Age Requirement",
  "Third-Party Services and Websites",
  "Changes to This Privacy Policy",
  "Contact",
];
const id = (n: number) => `s${n}`;
const H = ({ n }: { n: number }) => <h2 id={id(n)}>{n}. {SECTIONS[n - 1]}</h2>;

export default function PrivacyPage() {
  return (
    <div className="blog-page article-page">
      <BlogHeader />
      <main id="main-content">
        <article className="article-shell py-12 sm:py-16">
          <header>
            <p className="blog-eyebrow">Legal</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">BoatUNEET Privacy Policy</h1>
            <p className="mt-4 text-sm text-slate-500">
              Effective date: 19 October 2026 · Last updated: 19 October 2026 · Version {POLICY_VERSION}
            </p>
          </header>

          <div className="article-body mt-10">
            <p>
              This Privacy Policy explains how UNEET GROUP S.R.L., operating the BoatUNEET service, collects, uses,
              stores, shares and protects personal data when you visit our website, submit a lead form, request a
              boat market coverage check, create or use an account, communicate with us, or use BoatUNEET services.
            </p>

            <nav aria-label="Contents" className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-[0.95rem]">
              <p className="mb-2 font-semibold text-ink">Contents</p>
              <ol className="grid gap-1 sm:grid-cols-2" style={{ paddingLeft: 22 }}>
                {SECTIONS.map((s, i) => (
                  <li key={s}><a href={`#${id(i + 1)}`}>{s}</a></li>
                ))}
              </ol>
            </nav>

            <section>
              <H n={1} />
              <p>The data controller is UNEET GROUP S.R.L. (“BoatUNEET”, “we”, “us” or “our”).</p>
              <ul>
                <li>Registered address: {ADDRESS}</li>
                <li>CUI: 52829843</li>
                <li>VAT: RO54560120</li>
                <li>EUID / Trade Register reference: J2025084447000</li>
                <li>Email: <Mail /></li>
                <li>Telephone: <a href={`tel:${PHONE.replace(/\s/g, "")}`}>{PHONE}</a></li>
                <li>Website: www.boatuneet.com</li>
              </ul>
              <p>
                BoatUNEET is a service and trading name operated by UNEET GROUP S.R.L. We have not appointed a Data
                Protection Officer. Privacy and data-protection enquiries should be sent to <Mail />.
              </p>
            </section>

            <section>
              <H n={2} />
              <p>Depending on how you interact with BoatUNEET, we may collect the following categories of personal data:</p>
              <ul>
                <li><strong>Identity and contact data</strong>, such as your name, email address, telephone number and WhatsApp number.</li>
                <li><strong>Lead and enquiry data</strong>, including answers submitted through BoatUNEET forms, Meta/Facebook/Instagram lead forms, and information about your intention to sell or buy a boat.</li>
                <li><strong>Boat-related data</strong> that may be linked to you, including make, model, year, asking price, location, specifications, photographs, documents and listing information that you provide to us.</li>
                <li><strong>Account and activity data</strong>, including account details, login and security information, changes made to listings, approvals/rejections, consent records, publication events and other audit-log information.</li>
                <li><strong>Communications data</strong>, including email, WhatsApp and other messages exchanged with BoatUNEET. Where specifically requested and appropriately notified, calls may also be recorded or transcribed.</li>
                <li><strong>Technical and usage data</strong>, such as IP address, browser/device information, page views, clicks, scroll activity, session information, cookies, advertising identifiers and attribution data.</li>
                <li><strong>Verification data.</strong> At later stages of a transaction, sellers, authorised representatives or prospective buyers may be subject to identity/KYC verification. Verification may be performed by an external provider, while BoatUNEET may retain verification results and related records.</li>
              </ul>
            </section>

            <section>
              <H n={3} />
              <p>
                We collect personal data directly from you when you submit a form, create an account, request a market
                coverage check, contact us, communicate with us or use our services. We may also receive data from
                advertising and technology providers, including Meta platforms, and from service providers involved in
                delivering BoatUNEET services.
              </p>
              <p>
                Where BoatUNEET obtains personal data from another source, we will handle the data in accordance with
                applicable data-protection law and provide required information where applicable.
              </p>
            </section>

            <section>
              <H n={4} />
              <p>
                We process personal data only where we have an applicable legal basis. Depending on the activity, this
                may include steps taken at your request before entering into a contract, performance of a contract, our
                legitimate interests, your consent, or compliance with a legal obligation.
              </p>
              <ul>
                <li><strong>Lead handling and market coverage checks:</strong> to review your request, analyse your boat’s market presence and contact you about the results. Legal basis: steps taken at your request before entering into a contract and, where applicable, legitimate interests.</li>
                <li><strong>Providing BoatUNEET services:</strong> to create and manage accounts, prepare and distribute boat listings, manage enquiries, maintain service records and provide requested functionality. Legal basis: contract and pre-contractual steps.</li>
                <li><strong>Communications:</strong> to respond to enquiries and communicate by email, telephone or WhatsApp in connection with your request or service. Legal basis: contract/pre-contractual steps and legitimate interests.</li>
                <li><strong>Email marketing:</strong> to send promotional emails about BoatUNEET only where we have a valid legal basis and, where required, your separate consent. You can withdraw consent or unsubscribe at any time.</li>
                <li><strong>Security, fraud prevention and audit:</strong> to maintain logs, protect accounts and systems, investigate misuse and resolve disputes. Legal basis: legitimate interests and, where applicable, legal obligations.</li>
                <li><strong>Analytics and service improvement:</strong> to understand how BoatUNEET is used, improve workflows, algorithms and product performance, and develop market-intelligence features. Legal basis: legitimate interests; consent is used where required for non-essential cookies or similar technologies.</li>
                <li><strong>AI-assisted processing:</strong> to analyse, classify, structure, translate or summarise information and communications, assist with lead qualification, detect irrelevant or spam enquiries, and improve BoatUNEET systems. Legal basis depends on the underlying service purpose and may include contract, legitimate interests or consent.</li>
                <li><strong>Advertising measurement and retargeting:</strong> to measure campaigns and, where permitted, show relevant advertising to previous visitors. Where required, advertising technologies are activated only after the appropriate consent.</li>
                <li><strong>Verification:</strong> to verify sellers, representatives or prospective buyers at relevant stages, including KYC in connection with an LOI or transaction. Legal basis may include contract, legitimate interests and applicable legal obligations.</li>
              </ul>
            </section>

            <section>
              <H n={5} />
              <p>
                BoatUNEET may collect leads through forms provided by Meta Platforms, including Facebook and Instagram.
                When you submit a BoatUNEET lead form, Meta may transmit to us the information you choose to provide,
                such as your name, email address, telephone/WhatsApp number and answers about your boat.
              </p>
              <p>
                Meta processes information under its own terms and privacy policies. Once BoatUNEET receives your lead
                data, our processing of that data is governed by this Privacy Policy.
              </p>
              <p>
                Submitting a BoatUNEET lead form does not automatically subscribe you to unrelated email marketing.
                Where marketing consent is required, it is requested separately.
              </p>
            </section>

            <section>
              <H n={6} />
              <p>
                If you provide a WhatsApp number or choose WhatsApp as a communication channel, we may use it to contact
                you about your enquiry, market coverage check, boat or requested BoatUNEET services. Providing a WhatsApp
                number does not by itself constitute consent to unrelated promotional email or messaging.
              </p>
              <p>
                Communications may be processed using automated or AI-assisted tools for purposes such as summarisation,
                lead qualification, response assistance, spam detection and service improvement.
              </p>
            </section>

            <section>
              <H n={7} />
              <p>
                BoatUNEET may use cookies and similar technologies for essential functionality, security, analytics,
                performance measurement, advertising attribution and retargeting. These may include technologies
                provided by services such as Google, Meta and analytics or user-experience providers.
              </p>
              <p>
                For users where consent is legally required, non-essential analytics and advertising technologies
                should not be activated until the user has made the relevant consent choice. Users should be able to
                reject non-essential technologies and manage their preferences. You can change your choice at any time
                via “Cookie settings” in the footer of every page.
              </p>
            </section>

            <section>
              <H n={8} />
              <p>We do not sell personal data. We may disclose personal data, where necessary for the relevant purpose, to categories of recipients such as:</p>
              <ul>
                <li>hosting, infrastructure and database providers;</li>
                <li>email, communication and CRM providers;</li>
                <li>analytics, advertising and attribution providers;</li>
                <li>AI and technology service providers used to process or assist with content and communications;</li>
                <li>identity/KYC providers;</li>
                <li>payment and professional service providers where applicable;</li>
                <li>boat marketplaces and distribution partners where necessary to provide requested BoatUNEET services, while the seller’s private contact details are intended to remain private unless disclosure is specifically authorised or required;</li>
                <li>competent authorities where disclosure is required by law.</li>
              </ul>
              <p>
                Where BoatUNEET uses processors, we take appropriate steps to require them to handle personal data in
                accordance with applicable data-protection requirements.
              </p>
            </section>

            <section>
              <H n={9} />
              <p>
                Some of our technology, communication, analytics, advertising, AI, KYC or other service providers may
                process personal data outside the European Economic Area. Where applicable, BoatUNEET will rely on a
                lawful transfer mechanism and appropriate safeguards required by applicable data-protection law, such as
                an adequacy decision or contractual safeguards.
              </p>
            </section>

            <section>
              <H n={10} />
              <p>
                We retain personal data only for as long as reasonably necessary for the purposes described in this
                Policy and to meet legal, accounting, security and dispute-resolution requirements.
              </p>
              <ul>
                <li>Lead data for a person who does not become a customer may generally be retained for up to 5 years, unless earlier deletion is required or requested and no overriding lawful basis requires continued retention.</li>
                <li>Customer data and transaction/service history may generally be retained for up to 10 years after the end of the customer relationship, where justified by contractual, accounting, tax, legal, fraud-prevention or dispute-resolution requirements.</li>
                <li>Consent records, security logs and audit records may be retained for the period reasonably necessary to demonstrate compliance, protect the service and resolve disputes.</li>
                <li>Where data has been irreversibly anonymised so that it is no longer personal data, anonymised market or statistical information may be retained for longer.</li>
              </ul>
            </section>

            <section>
              <H n={11} />
              <p>
                BoatUNEET may use automated systems, scoring or AI-assisted processes to assess eligibility, detect risk
                or determine whether certain platform actions should be allowed. In some cases this may result in an
                automated refusal, such as refusal of publication or verification.
              </p>
              <p>
                Where applicable data-protection law provides a right to contest such a decision, users may request
                human review by contacting <Mail />. BoatUNEET will provide manual review of an appeal where required and
                appropriate.
              </p>
            </section>

            <section>
              <H n={12} />
              <p>Subject to applicable law and relevant exceptions, you may have the right to:</p>
              <ul>
                <li>request access to personal data we hold about you;</li>
                <li>request correction of inaccurate or incomplete personal data;</li>
                <li>request erasure of personal data;</li>
                <li>request restriction of processing;</li>
                <li>object to certain processing, including direct marketing;</li>
                <li>request portability of eligible personal data;</li>
                <li>withdraw consent at any time where processing is based on consent, without affecting processing that was lawful before withdrawal;</li>
                <li>contest applicable automated decisions and request human review;</li>
                <li>lodge a complaint with a competent data-protection supervisory authority.</li>
              </ul>
              <p>
                You may exercise these rights by contacting <Mail />. BoatUNEET may need to verify your identity before
                acting on a request. Users may also delete their BoatUNEET account and data through the{" "}
                <a href="/account/delete">account deletion page</a>. Account deletion does not require us to erase
                information that we are legally entitled or required to retain.
              </p>
            </section>

            <section>
              <H n={13} />
              <p>
                Where permitted, BoatUNEET may send marketing by email. Where consent is required, marketing consent is
                requested separately from a service enquiry. You may unsubscribe at any time using the unsubscribe
                mechanism in an email or by contacting us. Withdrawing marketing consent does not prevent us from sending
                necessary service-related communications.
              </p>
            </section>

            <section>
              <H n={14} />
              <p>
                We use reasonable technical and organisational measures designed to protect personal data against
                unauthorised access, loss, alteration, misuse or disclosure. No internet-based system can provide an
                absolute guarantee of security.
              </p>
            </section>

            <section>
              <H n={15} />
              <p>BoatUNEET is intended for adults aged 18 or over. We do not knowingly offer the service to children.</p>
            </section>

            <section>
              <H n={16} />
              <p>
                BoatUNEET may link to or interact with independent marketplaces, social networks, verification providers
                and other third-party services. Those third parties may process personal data under their own privacy
                policies and terms. This Policy does not replace the privacy notices of independent third parties.
              </p>
            </section>

            <section>
              <H n={17} />
              <p>
                We may update this Privacy Policy to reflect changes in our services, technology, legal requirements or
                data-processing practices. The current version will be published on the BoatUNEET website with the date
                of the latest update.
              </p>
            </section>

            <section>
              <H n={18} />
              <p>For privacy questions or to exercise your data-protection rights, contact:</p>
              <p>
                UNEET GROUP S.R.L. / BoatUNEET<br />
                {ADDRESS}<br />
                Email: <Mail /><br />
                Telephone: <a href={`tel:${PHONE.replace(/\s/g, "")}`}>{PHONE}</a>
              </p>
            </section>
          </div>
        </article>
      </main>
      <BlogFooter />
    </div>
  );
}
