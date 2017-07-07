#!/usr/bin/perl

for (glob('*.png')){
	my $new = $_;
	$new =~ s/(\d{4}-\d{2}-\d{2}).*/$1-0000.png/;
	print "$new\n";
	rename $_,$new;
}
