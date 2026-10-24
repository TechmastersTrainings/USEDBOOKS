import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({Key? key}) : super(key: key);

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  String _selectedCategory = 'all';
  String _selectedCondition = 'all';

  final List<Map<String, String>> _categories = const [
    {'id': 'all', 'label': 'All Books'},
    {'id': 'engineering', 'label': 'Engineering'},
    {'id': 'upsc', 'label': 'UPSC & KPSC'},
    {'id': 'medical', 'label': 'Medical'},
    {'id': 'fiction', 'label': 'Literature'},
  ];

  final List<Map<String, dynamic>> _sampleListings = const [
    {
      'title': 'Indian Polity for Civil Services',
      'authors': 'M. Laxmikanth',
      'price': 380,
      'mrp': 850,
      'condition': 'Very Good',
      'location': 'Bidar (Gandhi Gunj)',
      'missingPages': false,
      'imageUrl': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    },
    {
      'title': 'Higher Engineering Mathematics',
      'authors': 'Dr. B.S. Grewal',
      'price': 450,
      'mrp': 950,
      'condition': 'Good',
      'location': 'Bidar (Naubad)',
      'missingPages': false,
      'imageUrl': 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=400&auto=format&fit=crop&q=80',
    },
    {
      'title': 'Objective General English',
      'authors': 'S.P. Bakshi',
      'price': 190,
      'mrp': 395,
      'condition': 'Like New',
      'location': 'Bidar (Mailoor)',
      'missingPages': false,
      'imageUrl': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    },
    {
      'title': 'Concepts of Physics (Vol 1)',
      'authors': 'Dr. H.C. Verma',
      'price': 240,
      'mrp': 520,
      'condition': 'Very Good',
      'location': 'Bidar City',
      'missingPages': false,
      'imageUrl': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore Used Books'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category chips
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final cat = _categories[idx];
                final isSelected = _selectedCategory == cat['id'];
                return ChoiceChip(
                  label: Text(cat['label']!),
                  selected: isSelected,
                  selectedColor: AppColors.primarySubtle,
                  labelStyle: TextStyle(
                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 12,
                  ),
                  onSelected: (_) => setState(() => _selectedCategory = cat['id']!),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // Condition filter row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Icon(Icons.tune, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 4),
                const Text('Condition:', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _selectedCondition,
                  underline: const SizedBox(),
                  style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('All Conditions')),
                    DropdownMenuItem(value: 'like_new', child: Text('Like New')),
                    DropdownMenuItem(value: 'very_good', child: Text('Very Good')),
                    DropdownMenuItem(value: 'good', child: Text('Good')),
                  ],
                  onChanged: (val) => setState(() => _selectedCondition = val ?? 'all'),
                ),
              ],
            ),
          ),

          // Listings Grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.65,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: _sampleListings.length,
              itemBuilder: (context, index) {
                final item = _sampleListings[index];
                return Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Book Cover
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                          child: Image.network(
                            item['imageUrl'] as String,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['title'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              item['authors'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '₹${item['price']}',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 14),
                                ),
                                Text(
                                  'MRP ₹${item['mrp']}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: AppColors.textMuted,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.location_on, size: 10, color: AppColors.textMuted),
                                const SizedBox(width: 2),
                                Expanded(
                                  child: Text(
                                    item['location'] as String,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
