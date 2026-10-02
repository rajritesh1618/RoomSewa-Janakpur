import React, { useState } from 'react';
import {
  FileText,
  Save,
  Check,
  AlertCircle,
  Megaphone,
  HelpCircle,
  Shield,
  Phone,
  LayoutTemplate,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { AppContentConfig, AppFaqItem, AppNoticeItem } from '../../types';
import {
  isValidNepalMobile,
  formatFullNepalMobile,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../../utils/nepalPhone';
import { NepalPhoneInput } from '../common/NepalPhoneInput';

interface AdminContentManagerProps {
  content: AppContentConfig;
  onSaveContent: (updates: Partial<AppContentConfig>) => Promise<void>;
  onAddFaq: (faq: Omit<AppFaqItem, 'id'>) => Promise<void>;
  onUpdateFaq: (id: string, updates: Partial<AppFaqItem>) => Promise<void>;
  onDeleteFaq: (id: string) => Promise<void>;
  onAddNotice: (notice: Omit<AppNoticeItem, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateNotice: (id: string, updates: Partial<AppNoticeItem>) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
}

export const AdminContentManager: React.FC<AdminContentManagerProps> = ({
  content,
  onSaveContent,
  onAddFaq,
  onUpdateFaq,
  onDeleteFaq,
  onAddNotice,
  onUpdateNotice,
  onDeleteNotice
}) => {
  const [subTab, setSubTab] = useState<'brand' | 'home' | 'about' | 'contact' | 'policies' | 'faqs' | 'notices'>('brand');

  // Form states initialized from content
  const [appName, setAppName] = useState(content.appName || 'RoomSewa Janakpur');
  const [tagline, setTagline] = useState(content.tagline || '');
  const [logoUrl, setLogoUrl] = useState(content.logoUrl || '');
  const [bannerText, setBannerText] = useState(content.bannerText || '');
  const [bannerActive, setBannerActive] = useState(content.bannerActive ?? true);
  const [bannerLink, setBannerLink] = useState(content.bannerLink || '');

  // Homepage
  const [heroTitle, setHeroTitle] = useState(content.heroTitle || '');
  const [heroSubtitle, setHeroSubtitle] = useState(content.heroSubtitle || '');
  const [heroBadge, setHeroBadge] = useState(content.heroBadge || '');

  // About
  const [aboutHeading, setAboutHeading] = useState(content.aboutHeading || '');
  const [aboutStory, setAboutStory] = useState(content.aboutStory || '');
  const [aboutMission, setAboutMission] = useState(content.aboutMission || '');

  // Contact
  const [helplinePhone, setHelplinePhone] = useState(content.helplinePhone || '');
  const [supportEmail, setSupportEmail] = useState(content.supportEmail || '');
  const [whatsAppNumber, setWhatsAppNumber] = useState(content.whatsAppNumber || '');
  const [officeAddress, setOfficeAddress] = useState(content.officeAddress || '');
  const [operatingHours, setOperatingHours] = useState(content.operatingHours || '');

  // Policies
  const [rulesText, setRulesText] = useState(content.rulesText || '');
  const [termsText, setTermsText] = useState(content.termsText || '');
  const [privacyText, setPrivacyText] = useState(content.privacyText || '');

  // FAQ Modal
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<AppFaqItem | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Notice Modal
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<AppNoticeItem | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeAudience, setNoticeAudience] = useState<'all' | 'seekers' | 'owners'>('all');
  const [noticeIsUrgent, setNoticeIsUrgent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveAllGeneral = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (helplinePhone.trim() && !isValidNepalMobile(helplinePhone)) {
      setErrorMsg(`Helpline Phone is invalid. ${NEPAL_PHONE_ERROR_MESSAGE}`);
      return;
    }
    if (whatsAppNumber.trim() && !isValidNepalMobile(whatsAppNumber)) {
      setErrorMsg(`Support WhatsApp is invalid. ${NEPAL_PHONE_ERROR_MESSAGE}`);
      return;
    }

    setSaving(true);
    try {
      await onSaveContent({
        appName: appName.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        bannerText: bannerText.trim(),
        bannerActive,
        bannerLink: bannerLink.trim(),
        heroTitle: heroTitle.trim(),
        heroSubtitle: heroSubtitle.trim(),
        heroBadge: heroBadge.trim(),
        aboutHeading: aboutHeading.trim(),
        aboutStory: aboutStory.trim(),
        aboutMission: aboutMission.trim(),
        helplinePhone: helplinePhone.trim() ? formatFullNepalMobile(helplinePhone.trim()) : '',
        supportEmail: supportEmail.trim(),
        whatsAppNumber: whatsAppNumber.trim() ? formatFullNepalMobile(whatsAppNumber.trim()) : '',
        officeAddress: officeAddress.trim(),
        operatingHours: operatingHours.trim(),
        rulesText: rulesText.trim(),
        termsText: termsText.trim(),
        privacyText: privacyText.trim()
      });
      setSuccessMsg('App content updated and published live across RoomSewa!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save app content.');
    } finally {
      setSaving(false);
    }
  };

  // FAQ handlers
  const handleOpenAddFaq = () => {
    setEditingFaq(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setFaqModalOpen(true);
  };

  const handleOpenEditFaq = (f: AppFaqItem) => {
    setEditingFaq(f);
    setFaqQuestion(f.question);
    setFaqAnswer(f.answer);
    setFaqModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    if (editingFaq) {
      await onUpdateFaq(editingFaq.id, {
        question: faqQuestion.trim(),
        answer: faqAnswer.trim()
      });
    } else {
      await onAddFaq({
        question: faqQuestion.trim(),
        answer: faqAnswer.trim()
      });
    }
    setFaqModalOpen(false);
  };

  // Notice handlers
  const handleOpenAddNotice = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeAudience('all');
    setNoticeIsUrgent(false);
    setNoticeModalOpen(true);
  };

  const handleOpenEditNotice = (n: AppNoticeItem) => {
    setEditingNotice(n);
    setNoticeTitle(n.title);
    setNoticeContent(n.content);
    setNoticeAudience(n.targetAudience || 'all');
    setNoticeIsUrgent(Boolean(n.isUrgent));
    setNoticeModalOpen(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    if (editingNotice) {
      await onUpdateNotice(editingNotice.id, {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        targetAudience: noticeAudience,
        isUrgent: noticeIsUrgent
      });
    } else {
      await onAddNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        targetAudience: noticeAudience,
        isUrgent: noticeIsUrgent
      });
    }
    setNoticeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Subtabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 font-heading flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Live App Content & Policies
          </h3>
          <p className="text-xs text-slate-500">
            Edit and publish live changes to branding, homepage headlines, policies, FAQs, and notices.
          </p>
        </div>

        <button
          onClick={handleSaveAllGeneral}
          disabled={
            saving ||
            Boolean(helplinePhone.trim() && !isValidNepalMobile(helplinePhone)) ||
            Boolean(whatsAppNumber.trim() && !isValidNepalMobile(whatsAppNumber))
          }
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Publishing Changes...' : 'Save & Publish Live'}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200">
        {[
          { id: 'brand', label: 'Branding & Banner', icon: Megaphone },
          { id: 'home', label: 'Homepage Copy', icon: LayoutTemplate },
          { id: 'about', label: 'About & Mission', icon: FileText },
          { id: 'contact', label: 'Contact & Support', icon: Phone },
          { id: 'policies', label: 'Rules & Terms', icon: Shield },
          { id: 'faqs', label: 'Frequently Asked (FAQ)', icon: HelpCircle },
          { id: 'notices', label: 'Broadcast Notices', icon: Bell }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Brand & Banner */}
      {subTab === 'brand' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Brand Identity & Announcement Banner
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Application Name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL (Optional)</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://... logo image direct link"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                Top Announcement Banner
              </span>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Banner Active</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Banner Announcement Text</label>
              <input
                type="text"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                placeholder="e.g. Welcome to RoomSewa Janakpur — Find verified rooms near Janaki Mandir!"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Banner Action Link / Anchor</label>
              <input
                type="text"
                value={bannerLink}
                onChange={(e) => setBannerLink(e.target.value)}
                placeholder="#listings"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Homepage */}
      {subTab === 'home' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Homepage Hero & Intro Headlines
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hero Badge Text</label>
            <input
              type="text"
              value={heroBadge}
              onChange={(e) => setHeroBadge(e.target.value)}
              placeholder="e.g. Nepal's #1 Janakpur Local Rental Network"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hero Main Heading</label>
            <input
              type="text"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="e.g. Find Your Perfect Room or Flat in Janakpurdham"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hero Subtitle</label>
            <textarea
              rows={3}
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Tab 3: About & Mission */}
      {subTab === 'about' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            About RoomSewa Janakpur & Mission
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">About Section Heading</label>
            <input
              type="text"
              value={aboutHeading}
              onChange={(e) => setAboutHeading(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Our Story & Overview</label>
            <textarea
              rows={4}
              value={aboutStory}
              onChange={(e) => setAboutStory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mission Statement</label>
            <textarea
              rows={2}
              value={aboutMission}
              onChange={(e) => setAboutMission(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Contact & Support */}
      {subTab === 'contact' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Public Contact & Support Information
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <NepalPhoneInput
                value={helplinePhone}
                onChange={(_full, localDigits) => {
                  setHelplinePhone(localDigits ? formatFullNepalMobile(localDigits) : '');
                }}
                label="Helpline Phone"
                required={false}
                id="admin-content-helpline-phone"
                error={helplinePhone && !isValidNepalMobile(helplinePhone) ? NEPAL_PHONE_ERROR_MESSAGE : null}
                helperText="Fixed +977 prefix, 10 digits starting with 98 or 97."
              />
            </div>

            <div>
              <NepalPhoneInput
                value={whatsAppNumber}
                onChange={(_full, localDigits) => {
                  setWhatsAppNumber(localDigits ? formatFullNepalMobile(localDigits) : '');
                }}
                label="Support WhatsApp"
                required={false}
                id="admin-content-support-whatsapp"
                error={whatsAppNumber && !isValidNepalMobile(whatsAppNumber) ? NEPAL_PHONE_ERROR_MESSAGE : null}
                helperText="Fixed +977 prefix, 10 digits starting with 98 or 97."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@roomsewa.com"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Physical Office Address</label>
              <input
                type="text"
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                placeholder="e.g. Station Road, Ward No. 4, Janakpurdham, Dhanusha"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="e.g. Sunday to Friday, 8:00 AM - 8:00 PM NPT"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Policies */}
      {subTab === 'policies' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Rules, Terms & Privacy Policies
          </h4>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rental Guidelines & Community Rules</label>
            <textarea
              rows={4}
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Terms of Service</label>
            <textarea
              rows={4}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Privacy Policy Information</label>
            <textarea
              rows={4}
              value={privacyText}
              onChange={(e) => setPrivacyText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 font-mono"
            />
          </div>
        </div>
      )}

      {/* Tab 6: FAQs */}
      {subTab === 'faqs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Frequently Asked Questions ({content.faqs?.length || 0})
              </h4>
              <p className="text-xs text-slate-500">Add and edit questions displayed on public FAQ pages.</p>
            </div>
            <button
              onClick={handleOpenAddFaq}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add FAQ
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {(content.faqs || []).map((faq, idx) => (
              <div key={faq.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-900">
                    Q{idx + 1}. {faq.question}
                  </h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditFaq(faq)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteFaq(faq.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Notices */}
      {subTab === 'notices' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Broadcast Platform Notices ({content.notices?.length || 0})
              </h4>
              <p className="text-xs text-slate-500">Post announcements to all seekers, owners, or everyone.</p>
            </div>
            <button
              onClick={handleOpenAddNotice}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Notice
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {(content.notices || []).map((notice, idx) => (
              <div key={notice.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-900">{notice.title}</h5>
                    {notice.isUrgent && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase">
                        Urgent
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold uppercase">
                      Audience: {notice.targetAudience || 'all'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{notice.content}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditNotice(notice)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteNotice(notice.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {faqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              {editingFaq ? 'Edit FAQ Item' : 'Add New FAQ Item'}
            </h4>
            <form onSubmit={handleSaveFaq} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Question</label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  required
                  placeholder="e.g. How do I contact the room owner?"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Answer</label>
                <textarea
                  rows={3}
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  required
                  placeholder="Detailed answer..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              {editingNotice ? 'Edit Broadcast Notice' : 'Post New Broadcast Notice'}
            </h4>
            <form onSubmit={handleSaveNotice} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Title</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  required
                  placeholder="e.g. Special festive offers for student rentals"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notice Content</label>
                <textarea
                  rows={3}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  required
                  placeholder="Notice announcement details..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={noticeAudience}
                    onChange={(e) => setNoticeAudience(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="all">Everyone</option>
                    <option value="seekers">Seekers / Tenants</option>
                    <option value="owners">Property Owners</option>
                  </select>
                </div>
                <div className="pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeIsUrgent}
                      onChange={(e) => setNoticeIsUrgent(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded"
                    />
                    <span>Mark Urgent</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNoticeModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
