import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import SubjectCategories from "@/components/SubjectCategories";
import AIMatchingSection from "@/components/AIMatchingSection";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <SubjectCategories />
      <AIMatchingSection />
      <AboutSection />
      <ContactSection />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
