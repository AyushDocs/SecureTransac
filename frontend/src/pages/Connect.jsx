import { useState } from "react";

function Connect() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: ""
  });
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("http://localhost:5000/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...formData,
           type: formData.subject // Backend expects 'type', form uses 'subject'
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      setStatus("success");
      setFormData({ name: "", email: "", subject: "general", message: "" });
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-400">
            Have questions about integrating SecureTransac? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info Side */}
          <div className="space-y-6">
             <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Why Contact Us?</h3>
                <ul className="space-y-4 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 text-xl">🤝</span>
                    <div>
                      <strong className="block text-white">Partnerships</strong>
                      Explore integration opportunities for your dApp.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 text-xl">🛠️</span>
                    <div>
                      <strong className="block text-white">Technical Support</strong>
                      Get help with our API or SDK implementation.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-400 text-xl">📢</span>
                    <div>
                      <strong className="block text-white">Media Inquiries</strong>
                      Reach out for press kits and interviews.
                    </div>
                  </li>
                </ul>
             </div>

             <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                <p className="text-sm text-gray-500 mb-2">Direct Email</p>
                <a href="mailto:contact@securetransac.dao" className="text-cyan-400 font-mono text-lg hover:underline">
                  contact@securetransac.dao
                </a>
             </div>
          </div>

          {/* Form Side */}
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
            {status === "success" ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  ✓
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-gray-400 mb-6">Thank you for reaching out. We'll get back to you shortly.</p>
                <button 
                  onClick={() => setStatus("idle")}
                  className="text-cyan-400 font-bold hover:text-cyan-300"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="Jane Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="jane@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors appearance-none"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="partnership">Partnership Proposal</option>
                    <option value="support">Technical Support</option>
                    <option value="media">Media / Press</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Message</label>
                  <textarea
                    name="message"
                    required
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>

                {status === "error" && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                    Something went wrong. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Connect;
