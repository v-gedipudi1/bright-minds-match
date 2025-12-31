import { 
  Calculator, 
  FlaskConical, 
  BookOpen, 
  Code, 
  Globe, 
  Music, 
  Palette,
  TrendingUp 
} from "lucide-react";

const subjects = [
  { name: "Mathematics", icon: Calculator, count: 1240, color: "primary" },
  { name: "Science", icon: FlaskConical, count: 980, color: "accent" },
  { name: "Languages", icon: Globe, count: 1560, color: "secondary" },
  { name: "Programming", icon: Code, count: 720, color: "primary" },
  { name: "Literature", icon: BookOpen, count: 650, color: "accent" },
  { name: "Music", icon: Music, count: 340, color: "secondary" },
  { name: "Art & Design", icon: Palette, count: 280, color: "primary" },
  { name: "Business", icon: TrendingUp, count: 520, color: "accent" },
];

const SubjectCategories = () => {
  return (
    <section id="subjects" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">All Subjects</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Subject Categories
          </h2>
          <p className="text-muted-foreground text-lg">
            From math and science to music and art — find tutors for every subject you need.
          </p>
        </div>

        {/* Subject Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {subjects.map((subject, index) => (
            <button
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-medium transition-all duration-300 text-left"
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${
                  subject.color === "primary"
                    ? "bg-primary/10 group-hover:bg-primary/20"
                    : subject.color === "accent"
                    ? "bg-accent/10 group-hover:bg-accent/20"
                    : "bg-secondary/10 group-hover:bg-secondary/20"
                }`}
              >
                <subject.icon
                  className={`w-7 h-7 ${
                    subject.color === "primary"
                      ? "text-primary"
                      : subject.color === "accent"
                      ? "text-accent"
                      : "text-secondary"
                  }`}
                />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                {subject.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {subject.count.toLocaleString()} tutors
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubjectCategories;
