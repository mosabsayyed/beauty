import { useState } from 'react';
import { UniversalCanvas } from '../components/chat/UniversalCanvas';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

/**
 * Comprehensive Canvas Test Page
 * Tests ALL content types with AR/EN localization
 */

function CanvasTestPageContent() {
  const { language, setLanguage, isRTL } = useLanguage();
  const [selectedTest, setSelectedTest] = useState('chart-column');

  const translations = {
    title: language === 'ar' ? 'صفحة اختبار اللوحة' : 'Canvas Test Suite',
    subtitle: language === 'ar' ? 'اختبار جميع أنواع المحتوى' : 'Testing all content types',
    switchLang: language === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic',
  };

  // Comprehensive test data for ALL content types
  const testCases = {
    // CHARTS - All types
    'chart-column': {
      type: 'column',
      title: language === 'ar' ? 'المبيعات حسب المنطقة' : 'Sales by Region',
      config: {
        xAxis: { categories: ['North', 'South', 'East', 'West'] },
        yAxis: { title: { text: language === 'ar' ? 'المبيعات ($)' : 'Sales ($)' } },
        series: [
          { name: 'Q1', data: [120, 95, 140, 110] },
          { name: 'Q2', data: [150, 110, 160, 130] },
        ],
      },
      data: [
        { name: 'North', Q1: 120, Q2: 150 },
        { name: 'South', Q1: 95, Q2: 110 },
        { name: 'East', Q1: 140, Q2: 160 },
        { name: 'West', Q1: 110, Q2: 130 },
      ],
    },
    'chart-bar': {
      type: 'bar',
      title: language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue',
      config: {
        xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        series: [{ name: 'Revenue', data: [50000, 62000, 58000, 71000, 68000, 75000] }],
      },
      data: [
        { name: 'Jan', Revenue: 50000 },
        { name: 'Feb', Revenue: 62000 },
        { name: 'Mar', Revenue: 58000 },
        { name: 'Apr', Revenue: 71000 },
        { name: 'May', Revenue: 68000 },
        { name: 'Jun', Revenue: 75000 },
      ],
    },
    'chart-line': {
      type: 'line',
      title: language === 'ar' ? 'نمو المستخدمين' : 'User Growth',
      config: {
        xAxis: { categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
        series: [
          { name: 'Active Users', data: [1200, 1450, 1680, 1920] },
          { name: 'New Users', data: [300, 420, 380, 510] },
        ],
      },
      data: [
        { name: 'Week 1', 'Active Users': 1200, 'New Users': 300 },
        { name: 'Week 2', 'Active Users': 1450, 'New Users': 420 },
        { name: 'Week 3', 'Active Users': 1680, 'New Users': 380 },
        { name: 'Week 4', 'Active Users': 1920, 'New Users': 510 },
      ],
    },
    'chart-area': {
      type: 'area',
      title: language === 'ar' ? 'حركة المرور على الموقع' : 'Website Traffic',
      config: {
        xAxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        series: [{ name: 'Visitors', data: [2400, 3100, 2800, 3400, 4200] }],
      },
      data: [
        { name: 'Mon', Visitors: 2400 },
        { name: 'Tue', Visitors: 3100 },
        { name: 'Wed', Visitors: 2800 },
        { name: 'Thu', Visitors: 3400 },
        { name: 'Fri', Visitors: 4200 },
      ],
    },
    'chart-pie': {
      type: 'pie',
      title: language === 'ar' ? 'حصة السوق' : 'Market Share',
      config: {
        series: [{ name: 'Share', data: [40, 30, 20, 10] }],
      },
      data: [
        { name: 'Product A', value: 40 },
        { name: 'Product B', value: 30 },
        { name: 'Product C', value: 20 },
        { name: 'Product D', value: 10 },
      ],
    },
    'chart-radar': {
      type: 'radar',
      title: language === 'ar' ? 'تقييم الأداء' : 'Performance Evaluation',
      config: {
        xAxis: { categories: ['Speed', 'Quality', 'Cost', 'Reliability', 'Innovation'] },
        series: [
          { name: 'Team A', data: [85, 90, 75, 88, 92] },
          { name: 'Team B', data: [78, 85, 90, 82, 75] },
        ],
      },
      data: [
        { category: 'Speed', 'Team A': 85, 'Team B': 78 },
        { category: 'Quality', 'Team A': 90, 'Team B': 85 },
        { category: 'Cost', 'Team A': 75, 'Team B': 90 },
        { category: 'Reliability', 'Team A': 88, 'Team B': 82 },
        { category: 'Innovation', 'Team A': 92, 'Team B': 75 },
      ],
    },

    // TABLES
    'table-basic': {
      type: 'table',
      title: language === 'ar' ? 'بيانات الموظفين' : 'Employee Data',
      config: {
        columns: ['Name', 'Department', 'Salary', 'Start Date'],
        rows: [
          ['John Doe', 'Engineering', '$120,000', '2020-01-15'],
          ['Jane Smith', 'Marketing', '$95,000', '2019-06-01'],
          ['Bob Johnson', 'Sales', '$110,000', '2021-03-10'],
          ['Alice Williams', 'HR', '$85,000', '2018-11-20'],
        ],
      },
      data: [
        { Name: 'John Doe', Department: 'Engineering', Salary: '$120,000', 'Start Date': '2020-01-15' },
        { Name: 'Jane Smith', Department: 'Marketing', Salary: '$95,000', 'Start Date': '2019-06-01' },
        { Name: 'Bob Johnson', Department: 'Sales', Salary: '$110,000', 'Start Date': '2021-03-10' },
        { Name: 'Alice Williams', Department: 'HR', Salary: '$85,000', 'Start Date': '2018-11-20' },
      ],
    },

    // CODE - Multiple languages
    'code-python': `def fibonacci(n):
    """Calculate Fibonacci number using recursion"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Calculate first 10 Fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")`,

    'code-javascript': `function quickSort(arr) {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[arr.length - 1];
  const left = arr.filter((x, i) => x <= pivot && i < arr.length - 1);
  const right = arr.filter(x => x > pivot);
  
  return [...quickSort(left), pivot, ...quickSort(right)];
}

console.log(quickSort([3, 1, 4, 1, 5, 9, 2, 6]));`,

    'code-sql': `SELECT 
    e.employee_id,
    e.name,
    d.department_name,
    e.salary
FROM employees e
INNER JOIN departments d ON e.department_id = d.id
WHERE e.salary > 100000
ORDER BY e.salary DESC
LIMIT 10;`,

    // MARKDOWN
    'markdown': `# ${language === 'ar' ? 'وثيقة اختبار Markdown' : 'Markdown Test Document'}

## ${language === 'ar' ? 'الميزات المدعومة' : 'Supported Features'}

### ${language === 'ar' ? 'القوائم' : 'Lists'}
- ${language === 'ar' ? 'نقطة 1' : 'Bullet point 1'}
- ${language === 'ar' ? 'نقطة 2' : 'Bullet point 2'}
  - ${language === 'ar' ? 'عنصر متداخل' : 'Nested item'}
  - ${language === 'ar' ? 'عنصر متداخل آخر' : 'Another nested item'}

### ${language === 'ar' ? 'كتل الكود' : 'Code Blocks'}
\`\`\`python
print("Hello, World!")
\`\`\`

### ${language === 'ar' ? 'الجداول' : 'Tables'}
| ${language === 'ar' ? 'الميزة' : 'Feature'} | ${language === 'ar' ? 'الحالة' : 'Status'} |
|---------|--------|
| ${language === 'ar' ? 'العناوين' : 'Headers'} | ✅ |
| ${language === 'ar' ? 'القوائم' : 'Lists'} | ✅ |
| ${language === 'ar' ? 'الكود' : 'Code'} | ✅ |
| ${language === 'ar' ? 'الجداول' : 'Tables'} | ✅ |

### ${language === 'ar' ? 'التأكيد' : 'Emphasis'}
**${language === 'ar' ? 'نص عريض' : 'Bold text'}** ${language === 'ar' ? 'و' : 'and'} *${language === 'ar' ? 'نص مائل' : 'italic text'}*.`,

    // HTML
    'html': `<!DOCTYPE html>
<html lang="${language}">
<head>
  <title>${language === 'ar' ? 'محتوى HTML غني' : 'Rich HTML Content'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; direction: ${isRTL ? 'rtl' : 'ltr'}; }
    h1 { color: #D4AF37; }
    .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .feature-list { list-style-type: none; padding: 0; }
    .feature-list li { padding: 8px; margin: 4px 0; background: #f5f5f5; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${language === 'ar' ? 'محتوى HTML غني' : 'Rich HTML Content'}</h1>
  <div class="card">
    <h2>${language === 'ar' ? 'الميزات' : 'Features'}</h2>
    <ul class="feature-list">
      <li>${language === 'ar' ? 'محتوى منسق' : 'Styled content'}</li>
      <li>${language === 'ar' ? 'CSS مخصص' : 'Custom CSS'}</li>
      <li>${language === 'ar' ? 'عرض آمن' : 'Sandboxed rendering'}</li>
      <li>${language === 'ar' ? 'دعم RTL' : 'RTL support'}</li>
    </ul>
  </div>
</body>
</html>`,

    // MEDIA
    'image': 'https://picsum.photos/800/600',
    
    // EXCEL/CSV
    'excel-csv': `Name,Age,City,Salary,Department
John Doe,30,New York,75000,Engineering
Jane Smith,25,Los Angeles,65000,Marketing
Bob Johnson,35,Chicago,85000,Sales
Alice Williams,28,Houston,70000,HR
Charlie Brown,32,Phoenix,72000,Engineering
Diana Prince,29,Philadelphia,68000,Marketing`,
  };

  const testButtons = [
    { id: 'chart-column', label: language === 'ar' ? 'مخطط عمودي' : 'Column Chart', category: language === 'ar' ? 'المخططات' : 'Charts' },
    { id: 'chart-bar', label: language === 'ar' ? 'مخطط شريطي' : 'Bar Chart', category: language === 'ar' ? 'المخططات' : 'Charts' },
    { id: 'chart-line', label: language === 'ar' ? 'مخطط خطي' : 'Line Chart', category: language === 'ar' ? 'المخططات' : 'Charts' },
    { id: 'chart-area', label: language === 'ar' ? 'مخطط منطقة' : 'Area Chart', category: language === 'ar' ? 'المخططات' : 'Charts' },
    { id: 'chart-pie', label: language === 'ar' ? 'مخطط دائري' : 'Pie Chart', category: language === 'ar' ? 'المخططات' : 'Charts' },
    { id: 'chart-radar', label: language === 'ar' ? 'مخطط راداري' : 'Radar Chart', category: language === 'ar' ? 'المخططات' : 'Charts' },
    { id: 'table-basic', label: language === 'ar' ? 'جدول بيانات' : 'Data Table', category: language === 'ar' ? 'الجداول' : 'Tables' },
    { id: 'code-python', label: 'Python', category: language === 'ar' ? 'الكود' : 'Code' },
    { id: 'code-javascript', label: 'JavaScript', category: language === 'ar' ? 'الكود' : 'Code' },
    { id: 'code-sql', label: 'SQL', category: language === 'ar' ? 'الكود' : 'Code' },
    { id: 'markdown', label: 'Markdown', category: language === 'ar' ? 'المستندات' : 'Documents' },
    { id: 'html', label: 'HTML', category: language === 'ar' ? 'المستندات' : 'Documents' },
    { id: 'image', label: language === 'ar' ? 'صورة' : 'Image', category: language === 'ar' ? 'الوسائط' : 'Media' },
    { id: 'excel-csv', label: 'CSV/Excel', category: language === 'ar' ? 'البيانات' : 'Data' },
  ];

  // Group buttons by category
  const groupedButtons = testButtons.reduce((acc, btn) => {
    if (!acc[btn.category]) acc[btn.category] = [];
    acc[btn.category].push(btn);
    return acc;
  }, {} as Record<string, typeof testButtons>);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: 'var(--bg-primary)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      {/* Sidebar */}
      <div style={{
        width: 280,
        background: 'var(--bg-secondary)',
        borderRight: isRTL ? 'none' : '1px solid var(--component-panel-border)',
        borderLeft: isRTL ? '1px solid var(--component-panel-border)' : 'none',
        padding: 20,
        overflowY: 'auto',
      }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ 
            fontSize: 18, 
            fontWeight: 600, 
            marginBottom: 12,
            color: 'var(--component-text-primary)',
          }}>
            {translations.title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--component-text-secondary)', marginBottom: 16 }}>
            {translations.subtitle}
          </p>
          
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--gold)',
              color: 'var(--component-text-primary)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            {translations.switchLang}
          </button>
        </div>

        {/* Test buttons grouped by category */}
        {Object.entries(groupedButtons).map(([category, buttons]) => (
          <div key={category} style={{ marginBottom: 20 }}>
            <h3 style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: 'var(--component-text-muted)', 
              textTransform: 'uppercase',
              marginBottom: 8,
              letterSpacing: '0.05em',
            }}>
              {category}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {buttons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedTest(btn.id)}
                  style={{
                    padding: '10px 14px',
                    background: selectedTest === btn.id ? 'var(--gold)' : 'transparent',
                    color: selectedTest === btn.id ? 'var(--component-text-primary)' : 'var(--component-text-primary)',
                    border: '1px solid var(--component-panel-border)',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: selectedTest === btn.id ? 600 : 400,
                    textAlign: isRTL ? 'right' : 'left',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTest !== btn.id) {
                      e.currentTarget.style.background = 'rgba(212,175,55,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTest !== btn.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas area */}
      <div style={{ 
        flex: 1, 
        padding: 40,
        overflowY: 'auto',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
        }}>
          <h1 style={{ 
            fontSize: 24, 
            fontWeight: 600, 
            marginBottom: 8,
            color: 'var(--component-text-primary)',
          }}>
            {testButtons.find(b => b.id === selectedTest)?.label}
          </h1>
          <p style={{ 
            fontSize: 14, 
            color: 'var(--component-text-secondary)', 
            marginBottom: 24,
          }}>
            {language === 'ar' 
              ? 'اختبار عرض UniversalCanvas لهذا النوع من المحتوى'
              : 'Testing UniversalCanvas rendering for this content type'
            }
          </p>

          {/* Render the selected test case */}
          <div style={{
            background: 'var(--canvas-card-bg)',
            border: '1px solid var(--component-panel-border)',
            padding: 24,
            minHeight: 400,
          }}>
            <UniversalCanvas
              content={testCases[selectedTest as keyof typeof testCases]}
              title={testButtons.find(b => b.id === selectedTest)?.label}
              type={selectedTest.includes('code-') ? selectedTest.split('-')[1] : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CanvasTestPage() {
  return (
    <LanguageProvider>
      <CanvasTestPageContent />
    </LanguageProvider>
  );
}
